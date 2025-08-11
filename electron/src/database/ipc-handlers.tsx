import { ipcMain } from 'electron';
import { IcarusDB } from './adapter';


ipcMain.handle('db:getAllSessions', () => IcarusDB.getAllSessions());
ipcMain.handle('db:getSessionWithWorkflows', (_, id) => IcarusDB.getSessionWithWorkflows(id));
ipcMain.handle('db:saveSession', (_, session) => IcarusDB.saveSession(session));
ipcMain.handle('db:deleteSession', (_, id) => IcarusDB.deleteSession(id));
ipcMain.handle('db:saveWorkflow', (_, workflow) => IcarusDB.saveWorkflow(workflow));
