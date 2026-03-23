/**
Copyright 2026 JasmineGraph Team
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClusterRegistrationForm from "../../../../../Frontend/src/components/cluster-details/cluster-registration-form";
import { addNewCluster } from "@/services/cluster-service";
import useAccessToken from "@/hooks/useAccessToken";
import { useActivity } from "@/hooks/useActivity";

jest.mock("@/services/cluster-service", () => ({
	addNewCluster: jest.fn(),
}));

jest.mock("@/hooks/useAccessToken", () => jest.fn());

jest.mock("@/hooks/useActivity", () => ({
	useActivity: jest.fn(),
}));

jest.mock("antd", () => {
	const ReactLib = require("react");
	const FormContext = ReactLib.createContext(null);

	const Form = ({ name, onFinish, children }: any) => {
		const [values, setValues] = ReactLib.useState({});

		const handleChange = (field: string, value: string) => {
			setValues((prev: any) => ({ ...prev, [field]: value }));
		};

		const handleSubmit = (e: any) => {
			e.preventDefault();
			if (!(values as any).name || !(values as any).host || !(values as any).port) return;
			onFinish?.(values);
		};

		return (
			<form aria-label={name || "form"} onSubmit={handleSubmit}>
				<FormContext.Provider value={{ values, handleChange }}>{children}</FormContext.Provider>
			</form>
		);
	};

	Form.Item = ({ label, name, children }: any) => {
		const context: any = ReactLib.useContext(FormContext);
		const child = ReactLib.Children.only(children);
		if (!name) return <div>{children}</div>;

		return (
			<div>
				{label ? <label htmlFor={name}>{label}</label> : null}
				{ReactLib.cloneElement(child, {
					id: name,
					value: context?.values?.[name] || "",
					onChange: (e: any) => context?.handleChange(name, e.target.value),
				})}
			</div>
		);
	};

	const Input = (props: any) => <input type="text" {...props} />;

	const Button = ({ children, htmlType, onClick }: any) => (
		<button type={htmlType || "button"} onClick={onClick}>{children}</button>
	);

	const Select: any = ({ children }: any) => <div>{children}</div>;
	Select.Option = ({ children }: any) => <div>{children}</div>;

	return {
		Form,
		Input,
		Button,
		Select,
		Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
		message: {
			error: jest.fn(),
			loading: jest.fn(),
		},
	};
}, { virtual: true });

const mockAddNewCluster = addNewCluster as jest.MockedFunction<typeof addNewCluster>;
const mockUseAccessToken = useAccessToken as jest.MockedFunction<typeof useAccessToken>;
const mockUseActivity = useActivity as jest.MockedFunction<typeof useActivity>;
const mockMessage = require("antd").message as { error: jest.Mock; loading: jest.Mock };

describe("ClusterRegistrationForm", () => {
	const onSuccess = jest.fn();
	const onCancel = jest.fn();
	const resetFields = jest.fn();
	const mockForm = { resetFields } as any;

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseAccessToken.mockReturnValue({ getSrvAccessToken: jest.fn(() => "token-123") } as any);
		mockUseActivity.mockReturnValue({ reportErrorFromException: jest.fn() } as any);
	});

	it("renders required fields and action buttons", () => {
		render(<ClusterRegistrationForm onSuccess={onSuccess} onCancel={onCancel} form={mockForm} />);

		expect(screen.getByLabelText(/cluster name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/host/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
	});

	it("submits successfully and triggers success actions", async () => {
		const user = userEvent.setup();
		mockAddNewCluster.mockResolvedValue({} as any);

		render(<ClusterRegistrationForm onSuccess={onSuccess} onCancel={onCancel} form={mockForm} />);

		await user.type(screen.getByLabelText(/cluster name/i), "Cluster A");
		await user.type(screen.getByLabelText(/description/i), "Test description");
		await user.type(screen.getByLabelText(/host/i), "localhost");
		await user.type(screen.getByLabelText(/port/i), "7777");
		await user.click(screen.getByRole("button", { name: /add/i }));

		await waitFor(() => {
			expect(mockAddNewCluster).toHaveBeenCalledWith("Cluster A", "Test description", "localhost", "7777", "token-123");
		});

		expect(mockMessage.loading).toHaveBeenCalledWith("Connecting New Cluster", 2);
		expect(onSuccess).toHaveBeenCalled();
		expect(resetFields).toHaveBeenCalled();
	});

	it("resets form and calls onCancel when cancel is clicked", async () => {
		const user = userEvent.setup();

		render(<ClusterRegistrationForm onSuccess={onSuccess} onCancel={onCancel} form={mockForm} />);
		await user.click(screen.getByRole("button", { name: /cancel/i }));

		expect(resetFields).toHaveBeenCalled();
		expect(onCancel).toHaveBeenCalled();
	});
});
