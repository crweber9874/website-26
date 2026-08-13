import { describe, expect, test } from "vitest";
import { getProjectStatus } from "../src/lib/projects";

describe("getProjectStatus", () => {
	test("uses explicit status first", () => {
		expect(
			getProjectStatus({
				title: "A",
				description: "",
				tech: [],
				period: "2020",
				status: "active",
			}),
		).toBe("active");
	});

	test("infers active from present period", () => {
		expect(
			getProjectStatus({
				title: "A",
				description: "",
				tech: [],
				period: "2023 — Present",
			}),
		).toBe("active");
	});

	test("treats missing period as unspecified", () => {
		expect(getProjectStatus({ title: "A", description: "", tech: [] })).toBe(
			"unspecified",
		);
	});

	test("treats historical period as past", () => {
		expect(
			getProjectStatus({
				title: "A",
				description: "",
				tech: [],
				period: "2021 — 2022",
			}),
		).toBe("past");
	});
});
