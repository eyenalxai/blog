"use client"

import { getErrorMessage } from "@/lib/error-message"
import { ResultAsync, errAsync } from "neverthrow"

export const copyToClipboard = (text: string) => {
	if (navigator.clipboard?.writeText === undefined) {
		return errAsync("Clipboard API not available")
	}

	return ResultAsync.fromPromise(navigator.clipboard.writeText(text), (e) =>
		getErrorMessage(e, "Failed to copy to clipboard")
	)
}
