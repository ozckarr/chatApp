const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

const port = 3000

const {userJoin, removeUserOnLeave, getCurrentUser, getUsers} = require('./utils/users')

let roomPasswordList = [] 
let roomList = [] //not used only backup

app.use(express.static('public'))


io.on('connection', (socket) => {
    console.log('User connected')
    socket.leaveAll()
    socket.join('main')

    socket.on('get userlist', (checkRequest) => {
        getUsers()
        socket.emit('post userlist', getUsers())
    })

    socket.on('join room', ({username, color, room}) => {
        console.log("from join room")
        // getAllRoomsWithClients() //test
        const user = userJoin(socket.id, username, color, room)
        
        //Send userList to all users when new user joins.
        // io.emit('roomList',{userList: getUsers()})
        console.log(getUsers())
        socket.leaveAll()// User leaves all rooms. //test
        socket.join(user.room)
        io.emit('newRoomList', getAllRoomsWithClients())
        // console.log(io.sockets.adapter.rooms)
        // getAllRoomsWithClients() //test
        console.log("userName: " + username)

        socket.emit('message', {color: 'green', message: `Welcome ${username}`})

        socket.broadcast.to(user.room).emit('message', {color: 'green', message: `${username} has joined the chat`})
    })

    //Leave old room and join the new room and update room in users.
    socket.on('change room', ({username, room, password}) => {
        console.log(username, room, password)
        const user = getCurrentUser(socket.id)

        if(user){
            io.to(user.room).emit('message', {color: 'green', message: `${user.username} has left the chat`})
            socket.leaveAll()// User leaves all rooms.
            user.room = room
            socket.join(user.room) //User joins new room.
            socket.broadcast.to(user.room).emit('message', {color: 'green', message: `${username} has joined the chat`})
            
            //Send updated room/user list to all clients on roomList.
            // io.emit('roomList',{userList: getUsers()})
            io.emit('newRoomList', getAllRoomsWithClients())
        }
        // getAllRoomsWithClients() //test

    })

    socket.on('new room', ({username, room, password}) => {
        if(room){
            const roomFound = getAllRoomsWithClients().find(({ roomName }) => roomName === room)
            // console.log(getAllRoomsWithClients())
            console.log(roomFound)
            if(roomFound){
                console.log("room already exists will not add new room or password")
                //extra TODO send error: cant add room that already exists
            } else {
                console.log("room not found, will add new room and maybe password")
                const newRoom = {roomName: room, password: password}
                roomPasswordList.push(newRoom)
                socket.leaveAll()
                socket.join(room)
                io.emit('newRoomList', getAllRoomsWithClients())

            }
            console.log(roomPasswordList)
            //TODO remove empty rooms from password list.
            //TODO add password check in changeRoom
        }
    })
/* 
    socket.on('message', (message) => {
        io.emit('message', message)
    }) */

    //Listen for chat-message
    socket.on('message', (message) => {
        const user = getCurrentUser(socket.id)

        io.to(user.room).emit('message', {color: user.color, message: `${user.username}: ${message}`})
    })

    socket.on('someone writes', (writing) => {
        const user = getCurrentUser(socket.id)
        socket.broadcast.to(user.room).emit('writing', `${user.username} writes...`)

    })

    //runs when clientdisconnect
    socket.on('disconnect', () => {
        //Check which user that leaves
        const user = removeUserOnLeave(socket.id)

        if(user){
            io.to(user.room).emit('message', {color: 'green', message: `${user.username} has left the chat`})
            //Update all connected clients of the new user/room list.
            io.emit('roomList',{userList: getUsers()})
            io.emit('newRoomList', getAllRoomsWithClients())
        }
        
        console.log("someone disconnected.")
    })

    //Send userList to all on connect.
    // io.emit('roomList',{userList: getUsers()})
    // io.emit('newRoomList', {roomList: getAllRoomsWithClients()})
})

// let users = [
//     {
//         id: "97v9ds8f7fd89",
//         name: "Victor"
//     }
// ]

function getAllRoomsWithClients() {
    const availableRooms = []
    // console.log(Object.keys(io.sockets.adapter.rooms))
    const rooms = io.sockets.adapter.rooms
    if (rooms) {
        // console.log(rooms)
        for (const room in rooms) {
            // console.log(rooms[room].sockets)
            const usersInRoom = []
            for (const id in rooms[room].sockets) {
                if (rooms[room].sockets.hasOwnProperty(id)) {
                    // console.log(id)
                    const user = getUsers().find(user => user.id === id) //find user by socket.id. //bug if no users in list.
                    usersInRoom.push({id: id, name: user.username, color: user.color})
                }
            }

            //Check if room has password and set to true or false in newRoom object below.
            const roomFromPasswordList = roomPasswordList.find(({ roomName }) => roomName === room)
            let isPassword = false
            if(roomFromPasswordList){
                roomFromPasswordList.password ? isPassword = true : isPassword = false
            }
            
            const newRoom = {
                roomName: room, //Room name.
                roomPassword: isPassword, //Boolean true or false if room is password protected.
                users: usersInRoom //Array of users
            }
            availableRooms.push(newRoom)
        }
    }
    // console.log(availableRooms)
    // console.log(availableRooms[0])
    if(availableRooms.length > 0){
        roomList = availableRooms //not used only backup
        return availableRooms
    } else {
        roomList = availableRooms //not used only backup
        return false
    }
}

http.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`)
})