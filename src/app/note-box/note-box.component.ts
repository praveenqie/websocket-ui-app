import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WebsocketService } from '../websocket.service';

interface Note {
  text: string;
  userNames?: string[]; // Array of user names for the note
}

@Component({
  selector: 'app-note-box',
  templateUrl: './note-box.component.html',
  styleUrls: ['./note-box.component.css']
})
export class NoteBoxComponent implements OnInit {
  loggedInUserId: string = ''; // Stores the logged-in user ID
  loggedInUserName: string = ''; // Stores the final user name after adding
  notes: Note[] = [];
  currentNote: string = '';
  selectedNote: Note | null = null;
  isForEveryone: boolean = false; // Flag for public or private note
  showModal: boolean = false;
  modalType: 'add' | 'edit' | 'delete' | null = null;
  selectedUserNames: string[] = []; 
  // Sample user list (replace with actual user data)
  userList = [
    { id: 'user1', name: 'praveen', selected: false },
    { id: 'user2', name: 'naveen', selected: false },
    { id: 'user3', name: 'yogesh', selected: false }
];

  
  constructor(private websocketService: WebsocketService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.websocketService.connect();
  
    // Subscribe to noteReceived event
    this.websocketService.noteReceived.subscribe((note) => {
      console.log('Received note:', note);
  
      // Check if the logged-in user exists in the userIds array from the response
      if (note.userIds && note.userIds.includes(this.loggedInUserName)) {
        // Push the note to the notes array
        this.notes.push(note);
        this.cdr.detectChanges();
        console.log('Current notes after receiving:', this.notes);
      } else {
        console.log('Note not relevant to logged-in user, not added.');
      }
    });
  }
  
  
  isValidUser(user: any): user is { id: string; name: string } {
    return user && typeof user === 'object' && user.id && user.name;
  }
  addLoggedInUser() {
    const user = this.userList.find(u => u.name === this.loggedInUserId);
    if (user) {
      this.loggedInUserName = user.name; // Store the user's name
      this.loggedInUserId = ''; // Clear the input field after adding
    } else {
      alert('Please enter a valid user ID.');
    }
  }

  openModal(type: 'add' | 'edit' | 'delete') {
    this.modalType = type;
    if (type === 'add') {
      this.currentNote = '';
      this.isForEveryone = false; // Reset the flag
    } else if (type === 'edit' && this.selectedNote) {
      this.currentNote = this.selectedNote.text;
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedNote = null;
  }

  onForEveryoneChange() {
    if (this.isForEveryone) {
      // Additional logic can be added here if needed
    }
  }

  handleAction() {
    const selectedUserNames = this.userList
        .filter(user => user.selected) // Get only selected users
        .map(user => user.name); // Extract their names

    // const noteMessage = {
    //     text: this.currentNote,
    //     userNames: !this.isForEveryone ? selectedUserNames : [this.loggedInUserName], // Use selected user names or logged-in user's name
    //     isForEveryone: this.isForEveryone
    // };
    const noteMessage = {
      text: this.currentNote,
      userId: this.loggedInUserName, // If needed
      isForEveryone: this.isForEveryone, // Ensure this matches your backend
      userIds: this.isForEveryone ? [] : selectedUserNames, // Adjust as needed
      noteRefTopicId: null // Or set this based on your logic
  };
    //console.log('here is the data i selected'+noteMessage.userNames);
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
      console.log('Current notes after sending:', this.notes);
    }
  }

  selectNote(note: Note) {
    this.selectedNote = note;
  }

  toggleUserSelection(userName: string, isChecked: boolean) {
    if (isChecked) {
      this.selectedUserNames.push(userName);
    } else {
      const index = this.selectedUserNames.indexOf(userName);
      if (index > -1) {
        this.selectedUserNames.splice(index, 1);
      }
    }
  }

  editNote(noteMessage: any) {
    if (this.selectedNote) {
      const index = this.notes.indexOf(this.selectedNote);
      if (index > -1) {
        this.notes[index] = { ...this.selectedNote, text: this.currentNote };
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
      }
      this.selectedNote = null;
    }
  }
}
