import request from "@/utils/request"

import type { Login } from "@/utils/typing/raas"

export function userLogin(data:Login) {
    return request({
        url: '/login',
        method: 'post',
        data
    })
}