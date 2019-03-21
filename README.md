# snfind

## Recursively search for current directory files and folders

```bash
-f only search file
-d only search directory
-n find filename or directory name
-e exclude directory
```

example:
```bash
# search all directory
snfind -d

# search all file
snfind -f

snfind -f -n "^w.*\.js"

snfind -d -n "^w"

snfind -e "node_modules|dist"

```
