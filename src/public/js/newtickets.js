import { advanceQuery, log } from './help.js';

document.addEventListener('DOMContentLoaded', ()=>{
    log('ok');

    loadTickets();
})

async function loadTickets(){
    try {
        let rsp = await advanceQuery({ qry: 'Select * from users'}); log(rsp.data)  ;
    } catch (error) {
        log(error);
    }
}