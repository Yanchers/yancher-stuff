import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Device } from 'mediasoup-client';
import { Producer } from 'mediasoup-client/lib/Producer';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { Transport } from 'mediasoup-client/lib/Transport';
import { Consumer, ConsumerOptions } from 'mediasoup-client/lib/types';
import { RootState } from './store';

export const loadDevice = createAsyncThunk<void, { cap: RtpCapabilities }, { state: RootState }>(
    'websocket/loadDevice',
    async ({ cap }: { cap: RtpCapabilities }, thunkApi) => {
        console.log(cap);
        const { device, channel, userId } = thunkApi.getState().ws;
        await device.load({ routerRtpCapabilities: cap });
        console.log('device loaded');
        thunkApi.dispatch(sendMessage(JSON.stringify({ type: 'createTransport', channel, userId })));
    }
);
export const createProducer = createAsyncThunk<Producer | null, { isAudio: boolean }, { state: RootState }>(
    'websocket/CreateProducer',
    async ({ isAudio }, thunkApi) => {
        const { sendTransport, myVideoTrack, myAudioTrack } = thunkApi.getState().ws;
        if (!sendTransport || !myVideoTrack || !myAudioTrack) return null;

        return await sendTransport.produce({ track: isAudio ? myAudioTrack : myVideoTrack });
    }
);
export const createConsumer = createAsyncThunk<Consumer | null, { opts: ConsumerOptions }, { state: RootState }>(
    'websocket/CreateConsumer',
    async ({ opts }, thunkApi) => {
        const { recvTransport } = thunkApi.getState().ws;
        if (!recvTransport) return null;
        return await recvTransport.consume(opts);
    }
);
export const leaveChannelThunk = createAsyncThunk<void, void, { state: RootState }>(
    'websocket/LeaveChannel',
    async (_, thunkApi) => {
        const state = thunkApi.getState().ws;

        thunkApi.dispatch(resetTransport());
        thunkApi.dispatch(
            sendMessage(
                JSON.stringify({
                    type: 'leaveChannel',
                    userId: state.userId,
                    channel: state.channel,
                })
            )
        );
    }
);
//     'websocket/createProducer',
//     async (_, thunkApi) => {
//         const state = thunkApi.getState();
//         const send = state.sendTransport;
//         if (!send) {
//             console.error('Create SendTransport before creating producer.');
//             return null;
//         }
//         send.on('produce', (param, cb) => {
//             console.log('SEND Transport produce:', param);
//             thunkApi.dispatch(
//                 sendMessage(
//                     JSON.stringify({
//                         type: 'produce',
//                         kind: param.kind,
//                         rtpParameters: param.rtpParameters,
//                         rtpCapabilities: state.device.rtpCapabilities,
//                         channel: state.channel,
//                         clientId: send.id,
//                     })
//                 )
//             );
//             thunkApi.dispatch(setProducerIdCallback(cb));
//         });
//         const producer = await send.produce();
//         return producer;
//     }
// );

interface AppState {
    device: Device;
    sendTransport?: Transport;
    recvTransport?: Transport;
    channel?: string;
    userId: string;
    myVideoTrack?: MediaStreamTrack;
    myAudioTrack?: MediaStreamTrack;
    consumers: Consumer[];
    producers: Producer[];

    producerIdCallback: (param: { id: string }) => void;
}

const initialState: AppState = {
    userId: '',
    device: new Device(),
    consumers: [],
    producers: [],
    producerIdCallback: () => {},
};

export const wsSlice = createSlice({
    name: 'websocket',
    initialState,
    reducers: {
        sendMessage: (state, action: PayloadAction<string>) => {
            const data = JSON.parse(action.payload);
            if (data.type == 'joinChannel') {
                state.channel = data.channel;
                state.userId = data.userId;
            }
        },
        createSend: (state, action: PayloadAction<Transport>) => {
            state.sendTransport = action.payload;
        },
        createRecv: (state, action: PayloadAction<Transport>) => {
            state.recvTransport = action.payload;
        },
        setProducerIdCallback: (state, action: PayloadAction<(param: { id: string }) => void>) => {
            state.producerIdCallback = action.payload;
        },
        setMyVideo: (state, action: PayloadAction<MediaStreamTrack>) => {
            state.myVideoTrack = action.payload;
        },
        setMyAudio: (state, action: PayloadAction<MediaStreamTrack>) => {
            state.myAudioTrack = action.payload;
        },

        removeVideoProducer: (state) => {
            const found = state.producers.find((p) => p.kind == 'video');
            state.producers = state.producers.filter((p) => p.id != found?.id);
        },
        resetTransport: (state) => {
            state.consumers.forEach((c) => {
                c.close();
            });
            state.producers.forEach((p) => {
                p.close();
            });

            state = { ...state, channel: undefined, consumers: [], producers: [] };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadDevice.pending, () => {})
            .addCase(createProducer.fulfilled, (state, action) => {
                if (action.payload) state.producers.push(action.payload);
            })
            .addCase(createConsumer.pending, () => {})
            .addCase(createConsumer.fulfilled, (state, action) => {
                if (action.payload) state.consumers.push(action.payload);
            });
    },
});

export const {
    createSend,
    createRecv,
    setProducerIdCallback,
    setMyVideo,
    setMyAudio,
    removeVideoProducer,
    resetTransport,
    sendMessage,
} = wsSlice.actions;

export default wsSlice.reducer;
