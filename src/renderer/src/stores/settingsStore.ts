import { create } from "zustand";
import { DEFAULT_LAYOUT_ID, photoLayoutById } from "../../../config/layouts";

interface SettingsStore {
	outputDirectory: string;
	mockMode: boolean;
	countdownDuration: number;
	layoutFamily: "strip" | "postcard";
	shotCount: number;
	selectedFrame: string;
	setOutputDirectory: (value: string) => void;
	setMockMode: (value: boolean) => void;
	setCountdownDuration: (value: number) => void;
	setLayoutFamily: (value: "strip" | "postcard") => void;
	setShotCount: (value: number) => void;
	setSelectedFrame: (value: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
	outputDirectory: "",
	mockMode: false,
	countdownDuration: 3,
	layoutFamily: "postcard",
	shotCount: 3,
	selectedFrame:
		photoLayoutById.get(DEFAULT_LAYOUT_ID)?.availableFrames[0] ?? "",
	setOutputDirectory: (outputDirectory) => set({ outputDirectory }),
	setMockMode: (mockMode) => set({ mockMode }),
	setCountdownDuration: (countdownDuration) => set({ countdownDuration }),
	setLayoutFamily: (layoutFamily) => set({ layoutFamily }),
	setShotCount: (shotCount) => set({ shotCount }),
	setSelectedFrame: (selectedFrame) => set({ selectedFrame }),
}));
