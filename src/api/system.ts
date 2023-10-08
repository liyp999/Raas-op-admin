import request from "@/utils/request"

import type { System} from "@/utils/typing/raas"

export function System(data:System) {
    return request({
        url: '/sys',
        method: 'get',
        data
    })
}