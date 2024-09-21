import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WebsocketService } from '../websocket.service';

interface Note {
  text: string;
  userId?: string; // User ID for the note
}

@Component({
  selector: 'app-note-box',
  templateUrl: './note-box.component.html',
  styleUrls: ['./note-box.component.css']
})
export class NoteBoxComponent implements OnInit {
  notes: Note[] = [];
  currentNote: string = '';
  selectedNote: Note | null = null;
  isForEveryone: boolean = false; // Flag for public or private note
  selectedUserIds: string[] = []; // List of selected user IDs
  showModal: boolean = false;
  modalType: 'add' | 'edit' | 'delete' | null = null;

  // Sample user list (replace with actual user data)
  userList: { id: string; name: string }[] = [
    { id: 'user1', name: 'User One' },
    { id: 'user2', name: 'User Two' },
    { id: 'user3', name: 'User Three' }
  ];

  constructor(private websocketService: WebsocketService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.websocketService.connect();

    // Subscribe to noteReceived event
    this.websocketService.noteReceived.subscribe((note) => {
      console.log('Received public note:', note);
      this.notes.push(note);
      this.cdr.detectChanges();
      console.log('Current notes after receiving:', this.notes);
    });
  }

  openModal(type: 'add' | 'edit' | 'delete') {
    this.modalType = type;
    if (type === 'add') {
      this.currentNote = '';
      this.isForEveryone = false; // Reset the flag
      this.selectedUserIds = []; // Reset selected user IDs
    } else if (type === 'edit' && this.selectedNote) {
      this.currentNote = this.selectedNote.text;
      this.selectedUserIds = this.selectedNote.userId ? [this.selectedNote.userId] : []; // Example logic
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedNote = null;
  }

  onForEveryoneChange() {
    if (this.isForEveryone) {
      this.selectedUserIds = []; // Clear selection if for everyone
    }
  }

  handleAction() {
    const noteMessage = {
      text: this.currentNote,
      userId: this.selectedNote ? this.selectedNote.userId : null,
      isForEveryone: this.isForEveryone,
      userIds: this.isForEveryone ? [] : this.selectedUserIds // No user IDs if for everyone
    };

    if (this.modalType === 'add') {
      this.addNote(noteMessage);
    } else if (this.modalType === 'edit') {
      this.editNote(noteMessage);
    } else if (this.modalType === 'delete') {
      this.deleteNote();
    }
    this.closeModal();
  }

  addNote(noteMessage: any) {
    if (this.currentNote) {
      this.websocketService.sendMessage(noteMessage);
      this.currentNote = '';
      this.selectedUserIds = []; // Reset after sending
      console.log('Current notes after sending:', this.notes);
    }
  }

  selectNote(note: Note) {
    this.selectedNote = note;
  }

  editNote(noteMessage: any) {
    if (this.selectedNote) {
      const index = this.notes.indexOf(this.selectedNote);
      if (index > -1) {
        // Update the note in the list
        this.notes[index] = { ...this.selectedNote, text: this.currentNote };
        // Send the updated note message to the server
        this.websocketService.sendMessage(noteMessage);
      }
      this.selectedNote = null;
    }
  }

  deleteNote() {
    if (this.selectedNote) {
      const index = this.notes.indexOf(this.selectedNote);
      if (index > -1) {
        this.notes.splice(index, 1);
        // Optionally, send delete action to the server here
      }
      this.selectedNote = null;
    }
  }
}
