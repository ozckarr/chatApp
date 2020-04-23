const socket = io()

/* const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
}) */

window.addEventListener('load', () =>{
    init()
})

function init(){
    const userForm = document.querySelector('.join.ui')
    userForm.addEventListener('submit', onJoinRoom)
    const messageForm = document.querySelector('.messageInput button')
    messageForm.addEventListener('click', onSendMessage)

}

//socket.emit('joinRoom', {username, room})

socket.on('message', (message) => {
    const list = document.querySelector('.chatMessages')

    const listItem = document.createElement('li')
    listItem.innerText = message

    list.appendChild(listItem)
} )

function onJoinRoom(event){
    event.preventDefault()
    const joinModal = document.querySelector('.joinChatModal')
    joinModal.classList.add('hidden')
    const usernameInput = document.querySelector('#username')
    const username = usernameInput.value
    const room = 'main'

    socket.emit('join room', { username, room })
    console.log(room)
}

function onSendMessage(event) {
    console.log('I am clicked!')
    event.preventDefault()
    const input = document.querySelector('.messageInput input')
    socket.emit('message', input.value)
    input.value = ""
}

//Det här är allt som behövs för att skicka ett meddelande (client-side)
function sendMessage(){
    let input = document.getElementById("messageInput")
    let message = input.value
    input.value = ""

    //skickar meddelande
    socket.emit('message', {name, message})
}