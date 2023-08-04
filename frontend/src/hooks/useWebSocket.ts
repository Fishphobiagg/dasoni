import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';
import { useEffect, useState } from 'react';

interface Param {
  subscribe: (clinet: CompatClient) => void;
  // beforeDisconnected: (client: CompatClient) => void;
  // reconnectDelay?: number;
  // disconnectMessage?: string;
  // disconnectEndPoint?: string;
}

export const useWebSocket = ({ subscribe }: Param) => {
  // WebSocket 엔드포인트 URL을 여기에 입력합니다.
  const webSocketUrl = '/ws/chat';
  const [client, setClient] = useState<CompatClient>();

  useEffect(() => {
    const socket = new SockJS(webSocketUrl);
    const stompClient = Stomp.over(socket);
    setClient(stompClient);

    const onConnected = () => {
      console.log('WebSocket에 연결되었습니다.');
      // 원하는 토픽이나 큐에 stompClient.subscribe()를 사용하여 구독할 수 있습니다.
      // 예시: stompClient.subscribe('/topic/someTopic', onMessageReceived);
      subscribe(stompClient);
    };

    const onDisconnected = () => {
      console.log('WebSocket 연결이 끊어졌습니다.');
      // console.log('disconnectMessage ', disconnectMessage);
      // if (disconnectMessage) {
      //   stompClient.send(`/app/${disconnectEndPoint}`, {}, disconnectMessage);
      // }
      // beforeDisconnected(stompClient);
    };

    const onError = (error: any) => {
      console.error('WebSocket 오류:', error);
    };

    // WebSocket 연결을 수립합니다.
    stompClient.connect({}, onConnected, onError);

    // 컴포넌트가 언마운트될 때 연결을 정리합니다.
    return () => {
      stompClient.disconnect(onDisconnected);
    };
  }, [webSocketUrl]);

  return client;
};
