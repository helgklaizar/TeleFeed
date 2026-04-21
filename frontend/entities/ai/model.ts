import { create } from 'zustand';

export interface AiInstructions {
    daily: string;
    onDemand: string;
    [key: string]: string;
}

export interface AiState {
    instructions: AiInstructions;
    setInstructions: (inst: AiInstructions) => void;
}

export const useAiStore = create<AiState>((set) => ({
    instructions: (() => {
        try { return JSON.parse(localStorage.getItem('tg_instructions') || '{"daily":"","onDemand":""}'); }
        catch { return { daily: '', onDemand: '' }; }
    })(),
    setInstructions: (inst) => {
        try { localStorage.setItem('tg_instructions', JSON.stringify(inst)); } catch { }
        set({ instructions: inst });
    },
}));
