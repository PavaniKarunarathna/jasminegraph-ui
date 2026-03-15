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
import LoginForm from "../../../../../Frontend/src/components/auth/login-form";
import { userLogin } from "../../../../../Frontend/src/services/auth-service";
import { set_Is_User_Authenticated } from "../../../../../Frontend/src/redux/features/authData";
import useAccessToken from "../../../../../Frontend/src/hooks/useAccessToken";

jest.mock("../../../../../Frontend/src/services/auth-service", () => ({
	userLogin: jest.fn(),
}));

jest.mock("../../../../../Frontend/src/redux/features/authData", () => ({
	set_Is_User_Authenticated: jest.fn((value: boolean) => ({ type: "auth/set", payload: value })),
}));

jest.mock("../../../../../Frontend/src/hooks/useAccessToken", () => jest.fn());

const mockPush = jest.fn();
const mockDispatch = jest.fn();

jest.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

jest.mock("react-redux", () => ({
	useDispatch: () => mockDispatch,
}), { virtual: true });

jest.mock("antd", () => {
	const ReactLib: typeof React = require("react");
	const FormContext = ReactLib.createContext(null);

	const Form = ({ name, onFinish, children }: any) => {
		const [values, setValues] = ReactLib.useState<Record<string, string>>({});

		const handleChange = (field: string, value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }));
		};

		const handleSubmit = (e: any) => {
			e.preventDefault();
			if (!values.username || !values.password) return;
			onFinish?.(values);
		};

		return (
			<form aria-label={name} onSubmit={handleSubmit}>
				<FormContext.Provider value={{ values, handleChange }}>{children}</FormContext.Provider>
			</form>
		);
	};

	Form.Item = ({ label, name, children }: any) => {
		const context = ReactLib.useContext(FormContext);
		const child = ReactLib.Children.only(children);
		return (
			<div>
				{label ? <label htmlFor={name}>{label}</label> : null}
				{ReactLib.cloneElement(child, {
					id: name,
					value: context?.values?.[name] || "",
					onChange: (e: any) => context?.handleChange?.(name, e.target.value),
				})}
			</div>
		);
	};

	const Input = (props: any) => <input type="text" {...props} />;
	Input.Password = (props: any) => <input type="password" {...props} />;
	const Button = ({ children, htmlType }: any) => <button type={htmlType || "button"}>{children}</button>;

	return {
		Form,
		Input,
		Button,
		message: { warning: jest.fn() },
	};
}, { virtual: true });

const mockUserLogin = userLogin as jest.MockedFunction<typeof userLogin>;
const mockUseAccessToken = useAccessToken as jest.MockedFunction<typeof useAccessToken>;
const mockSetAuthenticated = set_Is_User_Authenticated as jest.MockedFunction<typeof set_Is_User_Authenticated>;
const mockMessage = require("antd").message as { warning: jest.Mock };

describe("LoginForm", () => {
	const mockSetSrvAccessToken = jest.fn();
	const mockSetSrvRefreshToken = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseAccessToken.mockReturnValue({
			setSrvAccessToken: mockSetSrvAccessToken,
			setSrvRefreshToken: mockSetSrvRefreshToken,
			getSrvAccessToken: jest.fn(() => ""),
			getSrvRefreshToken: jest.fn(() => ""),
			clearTokens: jest.fn(),
			isTokenExpired: jest.fn(() => false),
			refreshAccessToken: jest.fn(async () => ""),
		});
	});

	it("renders required fields and submit button", () => {
		render(<LoginForm />);

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
	});

	it("submits successfully with valid credentials", async () => {
		const user = userEvent.setup();
		mockUserLogin.mockResolvedValue({
			accessToken: "access-token-123",
			refreshToken: "refresh-token-456",
			data: { user: "test-user" },
		} as any);

		render(<LoginForm />);

		await user.type(screen.getByLabelText(/email/i), "test@example.com");
		await user.type(screen.getByLabelText(/password/i), "password123");
		await user.click(screen.getByRole("button", { name: /login/i }));

		await waitFor(() => {
			expect(mockUserLogin).toHaveBeenCalledWith("test@example.com", "password123");
		});

		expect(mockSetAuthenticated).toHaveBeenCalledWith(true);
		expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/set", payload: true });
		expect(mockSetSrvAccessToken).toHaveBeenCalledWith("access-token-123");
		expect(mockSetSrvRefreshToken).toHaveBeenCalledWith("refresh-token-456");
		expect(mockPush).toHaveBeenCalledWith("/clusters");
	});

	it("shows warning when login fails", async () => {
		const user = userEvent.setup();
		mockUserLogin.mockRejectedValue({ data: { message: "Invalid credentials" } });

		render(<LoginForm />);

		await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
		await user.type(screen.getByLabelText(/password/i), "wrongpassword");
		await user.click(screen.getByRole("button", { name: /login/i }));

		await waitFor(() => {
			expect(mockMessage.warning).toHaveBeenCalledWith("Invalid credentials");
		});
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("does not submit when required fields are empty", async () => {
		const user = userEvent.setup();
		render(<LoginForm />);

		await user.click(screen.getByRole("button", { name: /login/i }));

		expect(mockUserLogin).not.toHaveBeenCalled();
	});
});
