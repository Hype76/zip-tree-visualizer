import { FileSignatureAlert } from '../types/security';

export const validateSignature = (
  path: string, 
  buffer: Uint8Array, 
  extension: string
): FileSignatureAlert | null => {
  const hex = Array.from(buffer.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  // Magic Byte Definitions
  const signatures: Record<string, string> = {
    'png': '89 50 4E 47',
    'jpg': 'FF D8',
    'jpeg': 'FF D8',
    'gif': '47 49 46 38',
    'pdf': '25 50 44 46',
    'zip': '50 4B 03 04',
    'exe': '4D 5A',
    'webp': '52 49 46 46', // Partial, usually RIFF...WEBP
  };

  const normalizedExt = extension.toLowerCase();
  
  // 1. Check Image/Binary extensions against signatures
  if (signatures[normalizedExt]) {
    const expected = signatures[normalizedExt];
    // WEBP special case: Starts with RIFF
    if (normalizedExt === 'webp') {
       if (!hex.startsWith('52 49 46 46')) { // "RIFF"
         return { path, issue: "extension-mismatch", details: `Expected WEBP (RIFF header), found ${hex.substring(0, 11)}...` };
       }
       return null;
    }

    if (!hex.startsWith(expected)) {
      return { 
        path, 
        issue: "extension-mismatch", 
        details: `File extension is .${normalizedExt} but header is ${hex}` 
      };
    }
  }

  // 2. Check if a "text" file is actually a binary (e.g., hidden executable in .txt)
  const textExtensions = ['txt', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md', 'env', 'py', 'java', 'c', 'cpp'];
  if (textExtensions.includes(normalizedExt)) {
    // Check for null bytes in the first 512 bytes - strong indicator of binary
    const checkLength = Math.min(buffer.length, 512);
    for(let i=0; i<checkLength; i++) {
        if(buffer[i] === 0) {
            return {
                path,
                issue: "binary-mismatch",
                details: "File has text extension but contains binary data (null bytes)."
            }
        }
    }
    
    // Check if it's actually an EXE disguised as text
    if (hex.startsWith('4D 5A')) { // MZ header
         return {
            path,
            issue: "extension-mismatch",
            details: "CRITICAL: File appears to be a Windows Executable (PE) but has text extension."
        }
    }
  }

  return null;
};
