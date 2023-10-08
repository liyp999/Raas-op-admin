// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Login {
    username: string;
    password: string
}
export interface System {
    Sysip: string,
    Sysstatus: string,
    Shutdown: string,
    Reboot: string
}
export interface Laser {
    Laserip: string,
    Laserport: string
}