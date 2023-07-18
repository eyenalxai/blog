---
title: Async without asyncio
excerpt: Imagine you're not allowed to use asyncio, or futures, or threads, or processes...
date: 2023-07-19
author: Datxy Vellog
---

# Async without asyncio

[Full Code on GitHub](https://github.com/eyenalxai/async-no-asyncio)

So, we need to count from 0 to 5 and from 5 to 0.

```python
def count_up(*, n: int) -> None:
    for i in range(n):
        print(i)


def count_down(*, n: int) -> None:
    for i in range(n, 0, -1):
        print(i)


def main() -> None:
    count_up(n=5)
    count_down(n=5)
```

```shell
count_up: 0
count_up: 1
count_up: 2
count_up: 3
count_up: 4
count_dn: 5
count_dn: 4
count_dn: 3
count_dn: 2
count_dn: 1
```

**Concurrently.** 

So how do we do that?

Well with generators, of course!

Let's add a simple scheduler:
```python
AddTask: TypeAlias = Callable[[Generator], None]
Run: TypeAlias = Callable[[], None]
Scheduler: TypeAlias = tuple[AddTask, Run]


def scheduler() -> Scheduler:
    task_queue: deque = deque([], maxlen=200)

    def add_task(generator: Generator) -> None:
        task_queue.append(generator)

    def run() -> None:
        while task_queue:
            current_task = task_queue[0]
            try:
                next(current_task)
                task_queue.rotate(-1)
            except StopIteration:
                task_queue.popleft()

    return add_task, run
```

It works like this:
1. It has a queue of generators using `deque` from the standard library. Deque is a double-ended queue, which means we can append to the right and pop from the left.
2. Closure `add_task` receives a generator and appends it to the queue.
3. Closure `run` that, well, runs the first generator in the queue until it yields. If the generator is exhausted, it is removed from the queue. If the generator is not exhausted, it is moved to the end of the queue. That way we can run all generators in the queue, one by one.

Let's update our counting functions to be generators:
```python
def count_up(*, n: int) -> Generator[None, None, None]:
    for i in range(n):
        print(i)
        yield


def count_down(*, n: int) -> Generator[None, None, None]:
    for i in range(n, 0, -1):
        print(i)
        yield
```

I present to you our new `main` function:
```python
def main() -> None:
    add_task, run = scheduler()

    add_task(count_up(n=5))
    add_task(count_down(n=5))

    run()
```

I command thee, yield!

```shell
count_up: 0
count_dn: 5
count_up: 1
count_dn: 4
count_up: 2
count_dn: 3
count_up: 3
count_dn: 2
count_up: 4
count_dn: 1
```

That's a start, but even a toddler could've counted to 5 and back by now. I want HTTP requests!

But first I want some kind of `asyncio.sleep()` function. Let's make one:
```python
def async_sleep(*, seconds: int) -> Generator[None, None, None]:
    print(f"Task sleeping for {seconds} seconds started")

    end_time = time() + seconds

    while time() < end_time:
        yield

    print(f"Task sleeping for {seconds} seconds finished")
    yield
```

Basically, it's a generator that yields until a certain amount of time has passed. Each time it yields, the scheduler will run another task, and another task in our case is another call to `async_sleep`.
It's not very accurate, but as the saying goes, *simplicity means zero accuracy*.

Our updated `main` function:
```python
def main() -> None:
    add_task, run = scheduler()

    add_task(async_sleep(seconds=4))
    add_task(async_sleep(seconds=3))
    add_task(async_sleep(seconds=2))
    add_task(async_sleep(seconds=1))

    run()
```

Output:
```shell
Task sleeping for 4 seconds started
Task sleeping for 3 seconds started
Task sleeping for 2 seconds started
Task sleeping for 1 seconds started
Task sleeping for 1 seconds finished
Task sleeping for 2 seconds finished
Task sleeping for 3 seconds finished
Task sleeping for 4 seconds finished
```

Now we obviously want callbacks for myself and my friends. Implementation goes something like this:
```python
Callback: TypeAlias = Callable[[], Any]
AddTask: TypeAlias = Callable[[Generator[Any, Any, Any], Callback | None], None]
Run: TypeAlias = Callable[[], None]
Scheduler: TypeAlias = tuple[AddTask, Run]


def scheduler() -> Scheduler:
    task_queue: deque = deque([], maxlen=200)

    def add_task(generator: Generator, callback: Callback | None = None) -> None:
        task_queue.append((generator, callback))

    def run() -> None:
        while task_queue:
            current_task, current_callback = task_queue[0]
            try:
                next(current_task)
                task_queue.rotate(-1)
            except StopIteration:
                if current_callback:
                    current_callback()
                task_queue.popleft()

    return add_task, run
```

The only difference is that `add_task` now accepts an optional callback. If the callback is provided, it will be called when the task is finished.

Let's try it out:
```python
def main() -> None:
    add_task, run = scheduler()

    add_task(async_sleep(seconds=4), lambda: print("Callback 1 called"))
    add_task(async_sleep(seconds=3), lambda: print("Callback 2 called"))
    add_task(async_sleep(seconds=2), lambda: print("Callback 3 called"))
    add_task(async_sleep(seconds=1), lambda: print("Callback 4 called"))

    run()
```

Output:
```shell
Task sleeping for 4 seconds started
Task sleeping for 3 seconds started
Task sleeping for 2 seconds started
Task sleeping for 1 seconds started
Task sleeping for 1 seconds finished
Callback 4 called
Task sleeping for 2 seconds finished
Callback 3 called
Task sleeping for 3 seconds finished
Callback 2 called
Task sleeping for 4 seconds finished
Callback 1 called
```

This already gives us a lot of possibilities. Time to handle HTTP requests!

And it'll be a doozy.

We could've used some existing library for HTTP, or at least sockets, so we could've had at least a way to flush nicely, but might as well reinvent and this while we're at it.

Our `main`:
```python
def main() -> None:
    port = 8000
    add_task, run = scheduler()

    server_socket = socket(AF_INET, SOCK_STREAM)
    server_socket.setsockopt(SOL_SOCKET, SO_REUSEADDR, 1)
    server_socket.bind(("", port))
    server_socket.listen(4096)
    print(f"Listening on port {port}")

    try:
        run()
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received. Shutting down...")
        server_socket.close()
```

1. We create a socket, it doesn't matter what kind and how.
2. We set some options on the socket. I don't know what they do, but they're there. One of them looks like it's for reusing the address, so we can restart the server without waiting for the socket to be freed.
3. We bind the socket to the port.
4. We start listening for connections, with a backlog of 4096 connections. That's like, A LOT! 

Now we need to somehow listen for connections and handle them. We can't just block the main thread, so we'll have to make a generator that yields until a connection is received.
```python
Connections: TypeAlias = dict[tuple[str, int], socket]

def http_get_listener(
    *,
    server_socket: socket,
    add_task: AddTask,
) -> Generator[None, None, None]:
    connections: Connections = dict()

    while 2 + 2 == 4:
        ready_to_read, _, _ = select.select(
            [server_socket] + list(connections.values()),
            [],
            [],
            0.1,
        )
        for sock in ready_to_read:
            handle_socket(
                sock=sock,
                server_socket=server_socket,
                connections=connections,
                add_task=add_task,
            )

        yield
```

1. We create a dictionary of connections. The keys are the addresses of the clients, and the values are the sockets.
2. We enter an infinite loop, but I want it to break when fundamental math axioms are broken.
3. We use `select.select` to wait for a socket to be ready to read. We pass the server socket and all the client sockets to it, and it will return a list of sockets that are ready to read. We also pass a timeout of 0.1 seconds, so we don't block the main thread for too long. Could've been lower.
4. We iterate over the sockets that are ready to read, and call `handle_socket` on them.

You may ask, call what on them?

HANDLE SOCKET!

Ask for one function, get two extra for free!

```python
def handle_existing_connection(
    *,
    sock: socket,
    connections: Connections,
    add_task: AddTask,
) -> None:
    del connections[sock.getpeername()]

    request = sock.recv(1024)

    if request and b"GET" in request:
        uri = request.decode().split()[1]
        try:
            sleep_duration = int(uri.split("/")[-1])
        except ValueError:
            sleep_duration = 1

        print("Received GET request")
        add_task(
            async_request_sleeper(seconds=sleep_duration, socket_to_use=sock),
            lambda: sock.shutdown(SHUT_WR),
        )


def handle_new_connection(*, sock: socket, connections: Connections) -> None:
    client_socket, client_address = sock.accept()
    connections[client_address] = client_socket


def handle_socket(
    *,
    sock: socket,
    server_socket: socket,
    connections: Connections,
    add_task: AddTask,
) -> None:
    if sock is server_socket:
        return handle_new_connection(sock=server_socket, connections=connections)

    return handle_existing_connection(
        sock=sock, connections=connections, add_task=add_task
    )
```
`handle_socket`:
1. If the socket is the server socket, that means someone is asking to connect, so we call `handle_new_connection`.
2. Otherwise, we call `handle_existing_connection`.

`handle_existing_connection`:
1. We remove the socket from the connections dictionary, because we don't need it anymore.
2. We receive the request from the socket.
3. If the request is not empty and contains the string "GET", which inspired the name of the GET request, we parse the URI and extract the sleep duration from it. If the URI is not valid, we default to 1 second.
4. We print that we received a GET request, I like printing.
5. We add a task to the scheduler, code for him will be next, and pass it a callback that will shutdown the socket for writing when the task is finished.

`handle_new_connection`:
1. We accept the connection.
2. We add the client socket to the connections dictionary.
3. ???? That's it?

Finally, `async_request_sleeper`:
```python
def async_request_sleeper(
    *,
    seconds: int,
    socket_to_use: socket,
) -> Generator[None, None, None]:
    end_time = time() + seconds
    print(f"Sleeping for {seconds} seconds")

    while time() < end_time:
        yield

    socket_to_use.send(b"HTTP/1.1 200 OK\r\n\r\noof!!")
    print(f"Processed GET request: /{seconds}")
    yield
```

Finally 2: Revenge of the Sleepless:
```python
def main() -> None:
    port = 8000
    add_task, run = scheduler()

    server_socket = socket(AF_INET, SOCK_STREAM)
    server_socket.setsockopt(SOL_SOCKET, SO_REUSEADDR, 1)
    server_socket.bind(("", port))
    server_socket.listen(4096)
    print(f"Listening on port {port}")

    add_task(
        http_get_listener(server_socket=server_socket, add_task=add_task),
        None,
    )

    try:
        run()
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received. Shutting down...")
        server_socket.close()
```

LET'S GOO

```shell
Listening on port 8000
```

Well that was underwhelming. We need to make some requests to see it in action.

For that I allow for us to install some dependencies like `aiohttp`,  because we are cowards.

Here is a simple script that makes 10 requests to the server, with a sleep duration of 10 to 1 second. Did you know that in `lua`, arrays start at 1? I didn't either before I typed this.

Type this manually, it's very important:
```python
import asyncio

from aiohttp import ClientSession


async def main() -> None:
    number_of_requests = 10

    async def send_request(*, _session: ClientSession, seconds: int) -> None:
        async with _session.get(f"http://localhost:{8000}/{10 - seconds}") as response:
            print(await response.text())

    async with ClientSession() as session:
        tasks = [
            asyncio.create_task(send_request(_session=session, seconds=i))
            for i in range(number_of_requests)
        ]
        await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
```

Good for you if you didn't kill the server. 

```shell
Listening on port 8000
Received GET request
Sleeping for 9 seconds
Received GET request
Sleeping for 7 seconds
Received GET request
Sleeping for 5 seconds
Received GET request
Sleeping for 3 seconds
Received GET request
Sleeping for 1 seconds
Received GET request
Sleeping for 10 seconds
Received GET request
Sleeping for 8 seconds
Received GET request
Sleeping for 6 seconds
Received GET request
Sleeping for 4 seconds
Received GET request
Sleeping for 2 seconds
Processed GET request: /1
Processed GET request: /2
Processed GET request: /3
Processed GET request: /4
Processed GET request: /5
Processed GET request: /6
Processed GET request: /7
Processed GET request: /8
Processed GET request: /9
Processed GET request: /10
```

And we even got grouping of requests into even and odd for free! Cool feature!

Client's output:
```shell
I slept for 1 seconds
I slept for 2 seconds
I slept for 3 seconds
I slept for 4 seconds
I slept for 5 seconds
I slept for 6 seconds
I slept for 7 seconds
I slept for 8 seconds
I slept for 9 seconds
I slept for 10 seconds
```

It's basically as good as FastAPI at this point and without any of the dependencies. 