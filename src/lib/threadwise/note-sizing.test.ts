import {describe,it,expect} from 'vitest';
import {resizedNoteHeight} from './note-sizing';
describe('note resize',()=>{
  it('converts screen movement into canvas height exactly once at every zoom',()=>{expect(resizedNoteHeight(260,100,0.5)).toBe(460);expect(resizedNoteHeight(260,100,1)).toBe(360);expect(resizedNoteHeight(260,100,2)).toBe(310);});
  it('keeps notes readable and bounds their height',()=>{expect(resizedNoteHeight(260,-1000,1)).toBe(180);expect(resizedNoteHeight(260,2000,1)).toBe(1200);});
});