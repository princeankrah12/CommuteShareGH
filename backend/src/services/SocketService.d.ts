import { Server } from 'socket.io';
export declare class SocketService {
    private io;
    constructor(io: Server);
    private initialize;
    private setupHandlers;
    emitToRide(rideId: string, event: string, data: any): void;
}
//# sourceMappingURL=SocketService.d.ts.map