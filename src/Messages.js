class Messages {

    constructor() {
        
        this.messageDiv = document.createElement('div');
        this.messageDiv.id = 'messages';
        document.body.appendChild(this.messageDiv);
        this.messageDiv.style.fontSize = '0.7em';
        this.messageDiv.style.marginTop = '1em';
        this.messageDiv.style.paddingLeft = '1em';
        this.messageDiv.style.paddingRight = '1em';
        this.messageDiv.innerText = 'Messages:\n';
        
    }

    add(mesg) {
        //return;
        
        const currentMessages = this.messageDiv.innerText;
        this.messageDiv.innerText = currentMessages + '- ' + mesg + '\n';
        
    }

}

export default Messages;