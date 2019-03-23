# snfind

## Recursively search for current directory files and folders

example:
```bash
# search all directory
snfind -d

# search all file
snfind -f

# -n find filename or directory name
snfind -f -n "^w.*\.js"

snfind -d -n "^w"

# -e exclude directory
snfind -e "node_modules|dist"

# close recursion search , default true
snfind -r false 

# include hidden file
snfind -h 
```
