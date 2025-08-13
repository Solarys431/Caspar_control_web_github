# Comandi per terminare processi sulla porta 3000

## macOS/Linux

### Trovare il processo sulla porta 3000
```bash
lsof -ti:3000
```

### Terminare il processo sulla porta 3000
```bash
kill -9 $(lsof -ti:3000)
```

### Comando alternativo con netstat
```bash
netstat -tulpn | grep :3000
```

### Terminare tutti i processi Node.js (se necessario)
```bash
killall node
```

## Windows

### Trovare il processo sulla porta 3000
```cmd
netstat -ano | findstr :3000
```

### Terminare il processo (sostituire PID con l'ID del processo trovato)
```cmd
taskkill /PID <PID> /F
```

### Terminare direttamente tramite porta
```cmd
for /f "tokens=5" %a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %a
```