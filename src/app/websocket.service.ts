import { Injectable, EventEmitter } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private client: Client;
  private isConnected: boolean = false;
  public noteReceived: EventEmitter<any> = new EventEmitter(); // EventEmitter for received notes

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {},
      debug: (str) => { console.log(str); },
      onConnect: () => {
        console.log('Connected');
        this.isConnected = true;
        this.subscribeToPublicNotes(); // Subscribe to public notes after connecting
      },
      onDisconnect: () => {
        console.log('Disconnected');
        this.isConnected = false;
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      },
      onWebSocketClose: () => {
        console.error('WebSocket closed');
        this.isConnected = false;
      }
    });
  }

  public connect() {
    console.log('Connecting to WebSocket...');
    this.client.activate();
  }

  public sendMessage(noteMessage: any) {
    if (this.isConnected) {
      console.log('Sending message:', noteMessage);
      this.client.publish({ destination: '/app/note', body: JSON.stringify(noteMessage) });
    } else {
      console.error('Not connected to the WebSocket server');
    }
  }

  private subscribeToPublicNotes() {
    if (this.isConnected) {
      this.client.subscribe('/topic/public', (message) => {
        const note = JSON.parse(message.body);
        this.noteReceived.emit(note); // Emit the received note
      });
    } else {
      console.error('Not connected to the WebSocket server');
    }
  }

  public subscribeToPrivateNotes(userId: string, callback: (message: any) => void) {
    if (this.isConnected) {
      this.client.subscribe(`/topic/private/${userId}`, (message) => {
        callback(JSON.parse(message.body));
      });
    } else {
      console.error('Not connected to the WebSocket server');
    }
  }
}
