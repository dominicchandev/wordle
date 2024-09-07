enum MessageType {
    Welcome = 'welcome',
    CreateRoom = 'createRoom',
    RoomCreated = 'roomCreated',
    JoinRoom = 'joinRoom',
    PlayerJoinedRoom = 'playerJoinedRoom',
    PlaySingle = 'playSingle',
    Start = "start",
    Guess = 'guess',
    Feedback = 'feedback',
    ReportProgess = 'reportProgess',
    Result = 'result',
    RoomResult = 'roomResult',
    Error = 'error'
}

export default MessageType;