import { isAnyOf, Middleware, UnknownAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import {
    createConsumer,
    createProducer,
    createRecv,
    createSend,
    loadDevice,
    sendMessage,
    setProducerIdCallback,
} from './wsSlice';

const isCorrectType = isAnyOf(sendMessage);
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const wsMiddleware: Middleware<{}, RootState> = (storeApi) => {
    const socket = new WebSocket('ws://localhost:3000');

    socket.onmessage = async (msg) => {
        console.log(JSON.parse(msg.data));
        const data = JSON.parse(msg.data);

        switch (data.type) {
            case 'channelJoined': {
                storeApi.dispatch(
                    sendMessage(
                        JSON.stringify({
                            type: 'getRouterCapabilities',
                        })
                    )
                );
                break;
            }
            case 'routerCapabilities': {
                storeApi.dispatch(loadDevice({ cap: data.rtpCapabilities }) as unknown as UnknownAction);
                break;
            }
            case 'transportCreated': {
                const state = storeApi.getState();
                const sendTransport = state.ws.device.createSendTransport(data.sendParams);
                const recvTransport = state.ws.device.createRecvTransport(data.recvParams);
                sendTransport.on('connect', (param, cb) => {
                    console.log('SEND Transport connect:', param);
                    storeApi.dispatch(
                        sendMessage(
                            JSON.stringify({
                                type: 'transportConnect',
                                isSend: true,
                                dtlsParameters: param.dtlsParameters,
                                userId: state.ws.userId,
                            })
                        )
                    );
                    cb();
                });
                sendTransport.on('produce', (param, cb) => {
                    console.log('SEND Transport produce:', param);

                    storeApi.dispatch(setProducerIdCallback(cb));
                    storeApi.dispatch(
                        sendMessage(
                            JSON.stringify({
                                type: 'produce',
                                kind: param.kind,
                                rtpParameters: param.rtpParameters,
                                rtpCapabilities: state.ws.device.rtpCapabilities,
                                channel: state.ws.channel,
                                userId: state.ws.userId,
                            })
                        )
                    );
                });
                recvTransport.on('connect', (param, cb) => {
                    console.log('RECV Transport connect:', param);
                    storeApi.dispatch(
                        sendMessage(
                            JSON.stringify({
                                type: 'transportConnect',
                                channel: state.ws.channel,
                                isSend: false,
                                dtlsParameters: param.dtlsParameters,
                                userId: state.ws.userId,
                            })
                        )
                    );
                    cb();
                });
                // state.ws.sendTransport = sendTransport;
                // state.ws.recvTransport = recvTransport;
                storeApi.dispatch(createSend(sendTransport));
                storeApi.dispatch(createRecv(recvTransport));

                storeApi.dispatch(createProducer({ isAudio: true }) as unknown as UnknownAction);
                // await new Promise((r) => setTimeout(r, 1000));
                // storeApi.dispatch(createProducer({ isAudio: false }) as unknown as UnknownAction);
                break;
            }
            case 'producerCreated': {
                storeApi.getState().ws.producerIdCallback({ id: data.producerId });
                // TODO: reset callback ??? // storeApi.dispatch(setProducerIdCallback())
                break;
            }
            case 'newProducer': {
                const state = storeApi.getState().ws;
                storeApi.dispatch(
                    sendMessage(
                        JSON.stringify({
                            type: 'consume',
                            rtpCapabilities: state.device.rtpCapabilities,
                            producerId: data.producerId,
                            channel: state.channel,
                            userId: state.userId,
                        })
                    )
                );
                break;
            }
            case 'consumerCreated': {
                storeApi.dispatch(createConsumer({ opts: data.consumeParams }) as unknown as UnknownAction);
                break;
            }
            default:
                break;
        }
    };

    return (next) => (action) => {
        if (isCorrectType(action)) socket.send(action.payload);
        return next(action);
    };
};
