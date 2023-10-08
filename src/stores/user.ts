import { defineStore } from 'pinia'


interface logintype {
    code: string,
    msg: string
}
export const useUserStore = defineStore('user', {
    state: (): logintype => ({
        code: '1',
        msg: '2'
    }),
    actions: {
        
    },

});


