import request from "@/utils/request"

import type { Laser} from "@/utils/typing/raas"

export function Laser(data:Laser) {
    return request({
        url: '/login',
        method: 'post',
        data
    })
}