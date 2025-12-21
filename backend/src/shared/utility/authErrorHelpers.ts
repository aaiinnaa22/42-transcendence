// src/utils/handleFetchError.ts
export function handleFetchError(err: unknown, setError: any) {
    console.error(err);
  
    // Network / fetch errors
    if (err instanceof TypeError) {
      setError("Server is unreachable. Please try again later.");
      return;
    }
  
    // Normal JS errors (like throw new Error(...))
    if (err instanceof Error) {
      setError(err.message);
      return;
    }
  
    // Fallback for anything else
    setError("Something went wrong");
  }
  