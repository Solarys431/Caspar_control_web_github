# CasparCG Control Web - Project Overview

## Purpose
CasparCG Control Web è un'applicazione web professionale per il controllo completo del server CasparCG, utilizzata nel settore broadcast per gestire playout video, grafica in sovraimpressione, controllo mixer e gestione rundown/playlist.

## Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **UI Library**: Material-UI (@mui/material 5.12.1) con tema dark personalizzato
- **State Management**: Context API (CasparContext, RundownContext, AuthContext, CalendarContext)
- **Real-time Communication**: Socket.IO Client 4.6.1
- **Database**: Supabase client 2.49.5
- **HTTP Client**: Axios 1.3.6
- **Drag & Drop**: react-beautiful-dnd 13.1.1
- **Video Player**: react-player 2.12.0
- **Routing**: react-router-dom 6.10.0
- **Calendar**: react-big-calendar 1.18.0
- **Video Streaming**: hls.js 1.6.2

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Real-time Communication**: Socket.IO 4.6.1
- **CasparCG Integration**: Custom TCP client
- **OSC Protocol**: osc 2.4.4
- **Database**: Supabase server SDK 2.39.3
- **CORS**: cors 2.8.5
- **Logging**: morgan 1.10.0

## Architecture Type
Full-stack web application con architettura client-server:
- Frontend React SPA
- Backend Express.js API server
- Real-time bidirectional communication via Socket.IO
- Direct TCP connection to CasparCG Server
- Database integration with Supabase (PostgreSQL)