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
import UserRegistrationForm from "../../../../../Frontend/src/components/cluster-details/user-registration-form";
import { registerUser } from "../../../../../Frontend/src/services/auth-service";
import { useActivity } from "../../../../../Frontend/src/hooks/useActivity";

jest.mock("../../../../../Frontend/src/services/auth-service", () => ({
  registerUser: jest.fn(),
}));

jest.mock("../../../../../Frontend/src/hooks/useActivity", () => ({
  useActivity: jest.fn(),
}));

jest.mock("antd", () => {
  const ReactLib: typeof React = require("react");

  const FormContext = ReactLib.createContext<any>(null);

  const Form = ({ name, onFinish, children }: { name?: string; onFinish?: (values: Record<string, string>) => void; children: React.ReactNode }) => {
    const [values, setValues] = ReactLib.useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!values.firstName || !values.lastName || !values.email || !values.password || !values.confirm) return;
      if (values.password !== values.confirm) return;
      onFinish?.(values);
    };

    return (
      <form aria-label={name || "register"} onSubmit={handleSubmit}>
        <FormContext.Provider value={{ values, handleChange }}>{children}</FormContext.Provider>
      </form>
    );
  };

  Form.Item = ({ label, name, children }: { label?: string; name?: string; children: React.ReactElement }) => {
    const context = ReactLib.useContext(FormContext);
    const child = ReactLib.Children.only(children);
    if (!name) return <div>{children}</div>;

    return (
      <div>
        {label ? <label htmlFor={name}>{label}</label> : null}
        {ReactLib.cloneElement(child, {
          id: name,
          value: context?.values?.[name] || "",
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => context?.handleChange(name, e.target.value),
        })}
      </div>
    );
  };

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="text" {...props} />;
  Input.Password = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="password" {...props} />;

  const Button = ({ children, htmlType }: { children: React.ReactNode; htmlType?: "button" | "submit" }) => (
    <button type={htmlType || "button"}>{children}</button>
  );

  const Select: any = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  Select.Option = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

  return {
    Form,
    Input,
    Button,
    Select,
    message: {
      loading: jest.fn(),
      error: jest.fn(),
    },
  };
}, { virtual: true });

const mockRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;
const mockUseActivity = useActivity as jest.MockedFunction<typeof useActivity>;
const mockMessage = require("antd").message as { loading: jest.Mock; error: jest.Mock };

describe("UserRegistrationForm", () => {
  const onSuccess = jest.fn();
  const resetFields = jest.fn();
  const mockForm = { resetFields } as any;
  const mockReportError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActivity.mockReturnValue({ reportErrorFromException: mockReportError } as any);
  });

  it("renders required fields and register button", () => {
    render(<UserRegistrationForm onSuccess={onSuccess} form={mockForm} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("submits successfully and triggers success actions", async () => {
    const user = userEvent.setup();
    mockRegisterUser.mockResolvedValue({} as any);

    render(<UserRegistrationForm onSuccess={onSuccess} form={mockForm} />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/e-mail/i), "john@demo.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith("John", "Doe", "john@demo.com", "password123", undefined);
    });

    expect(mockMessage.loading).toHaveBeenCalledWith("Creating profile", 2);
    expect(onSuccess).toHaveBeenCalled();
    expect(resetFields).toHaveBeenCalled();
  });

  it("shows error and reports activity when registration fails", async () => {
    const user = userEvent.setup();
    const error = new Error("failed");
    mockRegisterUser.mockRejectedValue(error);

    render(<UserRegistrationForm onSuccess={onSuccess} form={mockForm} />);

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/e-mail/i), "jane@demo.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith("Failed to create profile");
    });

    expect(mockReportError).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
