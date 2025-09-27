import { log, jq } from './help.js';

document.addEventListener('DOMContentLoaded', ()=>{
    log('ok');

    jq('button.register, button.login').on('click', ()=>{
        jq('#loginForm, #registerFrom').toggleClass('d-none');
    })

    // jq('#loginForm').on('submit', async (e)=>{
    //     e.preventDefault();
    //     try {
    //         const form = document.getElementById('loginForm');
    //         const fd = new FormData(form);
    //         const payload = Object.fromEntries(fd.entries()); log(payload);

            
            
    //     } catch (error) {
    //         log(error);
    //     }
    // })
})