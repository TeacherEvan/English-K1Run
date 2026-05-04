/**
 * Home Menu Audio Hook
 *
 * Plays the Sangsom association audio sequence once per browser session when
 * the home menu first becomes available.
 *
 * @module hooks/use-home-menu-audio
 */

import { useEffect, useRef } from "react";
import { useSettings } from "../context/settings-context";
import { audioContextManager } from "../lib/audio/audio-context-manager";
import { soundManager } from "../lib/sound-manager";

const HOME_MENU_AUDIO_STORAGE_KEY = "homeMenuAssociationPlayed";
const ASSOCIATION_AUDIO_KEYS = [
	"welcome_sangsom_association",
	"welcome_sangsom_association_thai",
] as const;

let hasPlayedHomeMenuAssociation = false;

const isE2EMode = () => {
	if (typeof window === "undefined") return false;
	return new URLSearchParams(window.location.search).get("e2e") === "1";
};

const hasSessionPlayedHomeMenuAudio = () => {
	if (typeof window === "undefined") return false;
	try {
		return window.sessionStorage.getItem(HOME_MENU_AUDIO_STORAGE_KEY) === "true";
	} catch {
		return false;
	}
};

const markSessionHomeMenuAudioPlayed = () => {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(HOME_MENU_AUDIO_STORAGE_KEY, "true");
	} catch {
		// Ignore storage failures.
	}
};

export const resetHomeMenuAudioForTests = () => {
	hasPlayedHomeMenuAssociation = false;
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.removeItem(HOME_MENU_AUDIO_STORAGE_KEY);
	} catch {
		// Ignore storage failures.
	}
};

export const resetHomeMenuAudioMemoryForTests = () => {
	hasPlayedHomeMenuAssociation = false;
};

export const useHomeMenuAudio = () => {
	const { soundEnabled } = useSettings();
	const audioScheduledRef = useRef(false);

	useEffect(() => {
		if (!soundEnabled || audioScheduledRef.current || isE2EMode()) return;

		const alreadyPlayed =
			hasPlayedHomeMenuAssociation || hasSessionPlayedHomeMenuAudio();
		if (alreadyPlayed) {
			audioScheduledRef.current = true;
			return;
		}

		audioScheduledRef.current = true;

		let cancelled = false;
		const playSequence = async () => {
			try {
				const context = audioContextManager.getContext();
				if (context?.state === "suspended") {
					await context.resume();
				}

				let playbackCommitted = false;
				for (const key of ASSOCIATION_AUDIO_KEYS) {
					if (cancelled) return;
					await soundManager.playSound(
						key,
						key.endsWith("_thai") ? 0.9 : 1.0,
						0.85,
					);
					if (!playbackCommitted) {
						playbackCommitted = true;
						hasPlayedHomeMenuAssociation = true;
						markSessionHomeMenuAudioPlayed();
					}
				}
			} catch (error) {
				if (import.meta.env.DEV) {
					console.warn(
						"[HomeMenuAudio] Association playback failed:",
						error instanceof Error ? error.message : String(error),
					);
				}
			}
		};

		const timer = window.setTimeout(() => {
			void playSequence();
		}, 400);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [soundEnabled]);
};
