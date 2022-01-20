import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, Input, Radio, DatePicker, Select } from "antd";
import { VALIDATE_MESSAGE, LAYOUT } from "@/utils/ui.util";
import permissionsUtil from "@/utils/permission.util";
import { createPayment } from "../../hooks/ledger";
import { useCompanyAttributes } from "@/hooks/company";
import { useCustomerAttributes } from "@/hooks/customers";
import AppBackButton from "@/components/backButton";
import { SPEND_TYPE } from "@/utils/api.util";

const canCreate = permissionsUtil.checkAuth({
  category: "transaction",
  action: "create",
});

const { Option } = Select;

const CreateTransaction = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState();
  const [customerId, setCustomerId] = useState();

  const [paymentType, setPaymentType] = useState("CASH");

  const { company, isLoading: companyLoading } = useCompanyAttributes(["companyName", "id"]);
  const { customers, isLoading: customerLoading } = useCustomerAttributes(["firstName", "lastName", "id"]);

  const companyData = company ? [{ id: -1, companyName: "Other" }, ...company] : [];
  const customerData = customers ? [{ id: -1, firstName: "Other", lastName: "" }, ...customers] : [];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { totalAmount, otherName, paymentDate } = values;

      let params = {
        totalAmount,
        spendType: SPEND_TYPE.DEBIT,
        paymentDate: new Date(paymentDate),
        paymentType,
        otherName: companyId === -1 || customerId === -1 ? otherName : "",
      };

      params = companyId !== -1 ? { ...params, companyId } : params;
      params = customerId !== -1 ? { ...params, customerId } : params;

      await createPayment(params);
      router.push("/ledger");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const onChange = (e) => {
    setPaymentType(e.target.value);
  };

  const handleSelectCompany = (value) => {
    setCompanyId(value);
  };

  const handleSelectCustomer = (value) => {
    setCustomerId(value);
  };
  const renderCheckForm = () => {
    return (
      <>
        <Form.Item
          name="customerName"
          label="Full Name"
          rules={[
            {
              required: true,
              type: "string",
            },
          ]}
        >
          <Input placeholder="Enter Full Name" />
        </Form.Item>
        <Form.Item
          name="chequeId"
          label="Cheque ID"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder="Enter Cheque ID" />
        </Form.Item>
        {/* <Form.Item
          name="chequeAmount"
          label="Amount"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input placeholder="Enter Cheque Amount"  />
        </Form.Item> */}
        <Form.Item
          name="dueDate"
          label="Due Date"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="chequeStatus"
          label="Cheque Status"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select placeholder="Select Status">
            <Option key="1" value="PASS">
              Pass
            </Option>
            <Option key="2" value="RETURN">
              Return
            </Option>
            <Option key="3" value="CANCEL">
              Cancel
            </Option>
          </Select>
        </Form.Item>
      </>
    );
  };

  return (
    <div>
      <h2>Create Transaction</h2>

      <Form {...LAYOUT} name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Form.Item name="paymentType" label="Payment Type">
          <Radio.Group onChange={onChange} defaultValue="CASH" value={paymentType}>
            <Radio value="CASH">Cash</Radio>
            <Radio value="ONLINE">Online</Radio>
            <Radio value="CHEQUE">Cheque</Radio>
          </Radio.Group>
        </Form.Item>
        {paymentType === "CHEQUE" ? renderCheckForm() : null}
        <Form.Item
          name="companyId"
          label="Paid To"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select loading={companyLoading} placeholder="Select Company" allowClear onChange={handleSelectCompany}>
            {companyData &&
              companyData.map((obj) => (
                <Option key={obj.id} value={obj.id} disabled={obj.id === -1 && customerId === -1}>
                  {obj.companyName}
                </Option>
              ))}
          </Select>
        </Form.Item>

        {companyId === -1 ? (
          <Form.Item
            name="otherName"
            label="Name"
            rules={[
              {
                required: true,
                type: "string",
              },
            ]}
          >
            <Input />
          </Form.Item>
        ) : null}

        <Form.Item
          name="customerId"
          label="Paid By"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select loading={customerLoading} placeholder="Select Customer" allowClear onChange={handleSelectCustomer}>
            {customerData &&
              customerData.map((obj) => (
                <Option key={obj.id} value={obj.id} disabled={obj.id === -1 && companyId === -1}>
                  {`${obj.firstName} ${obj.lastName}`}
                </Option>
              ))}
          </Select>
        </Form.Item>

        {customerId === -1 ? (
          <Form.Item
            name="otherName"
            label="Name"
            rules={[
              {
                required: true,
                type: "string",
              },
            ]}
          >
            <Input />
          </Form.Item>
        ) : null}

        <Form.Item
          name="totalAmount"
          label="Amount"
          rules={[
            {
              required: true,
              type: "string",
            },
          ]}
        >
          <Input placeholder="Enter Amount" />
        </Form.Item>

        <Form.Item
          name="paymentDate"
          label="Payment Date"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item wrapperCol={{ ...LAYOUT.wrapperCol, offset: 2 }}>
          <AppBackButton />
          <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
export default CreateTransaction;
