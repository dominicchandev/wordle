enum MessageType {
    Welcome = 'welcome',
    CreateRoom = 'createRoom',
    RoomCreated = 'roomCreated',
    JoinRoom = 'joinRoom',
    playerJoinedRoom = 'playerJoinedRoom',
    PlaySingle = 'playSingle',
    Start = "start",
    Guess = 'guess',
    Feedback = 'feedback',
    Result = 'result',
    Error = 'error'
}

export default MessageType;