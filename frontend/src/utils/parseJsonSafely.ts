/**
 * Safely parse JSON response.
 * When backend is down, nginx returns HTML error pages (502/503).
 * This prevents SyntaxError and shows a user-friendly message.
 */
export async function parseJsonSafely(response: Response): Promise<any> {
	try {
		return await response.json();
	} catch {
		throw new Error("Cannot reach server");
	}
}
