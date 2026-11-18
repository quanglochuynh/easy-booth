import type { SetStateAction } from "react";
import { create } from "zustand";

interface UiStore {
	adminOpen: boolean;
	errorMessage: string;
	setAdminOpen: (value: SetStateAction<boolean>) => void;
	setErrorMessage: (value: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
	adminOpen: false,
	errorMessage: "",
	setAdminOpen: (value) =>
		set((state) => ({
			adminOpen: typeof value === "function" ? value(state.adminOpen) : value,
		})),
	setErrorMessage: (errorMessage) => set({ errorMessage }),
}));
