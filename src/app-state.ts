import { Device, Producer, Transport } from 'mediasoup-client/lib/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    device: Device;
    sendTransport?: Transport;
    sendProducerCallback?: (param: { id: string }) => void;
    recvTransport?: Transport;
    channel?: string;
    producers: Producer[];

    setSend: (sendTransport: Transport) => void;
    setSendProducerCallback: (cb: (param: { id: string }) => void) => void;
    setSendProducer: (producerId: string) => void;
    addProducer: (p: Producer) => void;
    setRecv: (recvTransport: Transport) => void;
    setChannel: (ch: string) => void;
}

export const useAppState = create<AppState>()(
    persist(
        (set) => ({
            device: new Device(),
            producers: [],
            setSend: (send) => set((state) => ({ ...state, sendTransport: send })),
            setSendProducerCallback: (cb) => set((state) => ({ ...state, sendProducerCallback: cb })),
            setSendProducer: (id) =>
                set((state) => {
                    if (state.sendProducerCallback) state.sendProducerCallback({ id });
                    return { ...state };
                }),
            addProducer: (p) => set((state) => ({ ...state, producers: [...state.producers, p] })),
            setRecv: (recv) => set((state) => ({ ...state, recvTransport: recv })),
            setChannel: (ch) => set((state) => ({ ...state, channel: ch })),
        }),
        {
            name: 'app-state',
        }
    )
);
