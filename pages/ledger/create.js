import { useState } from "react";

import { Button, Form, Input, message, Radio, Select } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";

import AppBackButton from "@/components/backButton";
import DatePicker from "@/components/datePicker";
import { useCompanyAttributes } from "@/hooks/company";
import { useCustomerAttributes } from "@/hooks/customers";
import { PAYMENT_TYPE, SPEND_TYPE } from "@/utils/api.util";
import permissionsUtil from "@/utils/permission.util";
import { VALIDATE_MESSAGE } from "@/utils/ui.util";

import { createPayment } from "../../hooks/ledger";
import { selectSearchFilter } from "@/utils/filter.util";

const canCreate = permissionsUtil.checkAuth({
  category: "transaction",
  action: "create",
});

const { Option } = Select;
const OTHER_SENTINEL = -1;

const CreateTransaction = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [payToType, setPayToType] = useState("company");
  const [payByType, setPayByType] = useState("customer");
  const [payToId, setPayToId] = useState();
  const [payById, setPayById] = useState();

  const [paymentType, setPaymentType] = useState(PAYMENT_TYPE.CASH);

  const { company, isLoading: companyLoading } = useCompanyAttributes(["companyName", "id"]);
  const { customers, isLoading: customerLoading } = useCustomerAttributes(["firstName", "lastName", "id"]);

  const companyData = company || [];
  const customerData = customers || [];

  const isDefaultCombo = payToType === "company" && payByType === "customer";
  const payToCompanyData = isDefaultCombo
    ? [{ id: OTHER_SENTINEL, companyName: "Other" }, ...companyData]
    : companyData;
  const payByCustomerData = isDefaultCombo
    ? [{ id: OTHER_SENTINEL, firstName: "Other", lastName: "" }, ...customerData]
    : customerData;

  const onFinish = async (values) => {
    if (payToType === payByType && payToId === payById && payToId !== OTHER_SENTINEL && payToId !== undefined) {
      message.error("Pay To and Pay By cannot be the same party");
      return;
    }

    setLoading(true);
    try {
      const { totalAmount, otherName, paymentDate, reference } = values;

      let params = {
        payToType,
        payToId,
        payByType,
        payById,
        totalAmount,
        reference,
        spendType: SPEND_TYPE.DEBIT, // todo
        paymentDate: dayjs(paymentDate),
        paymentType,
        otherName: payToId === OTHER_SENTINEL || payById === OTHER_SENTINEL ? otherName : "",
      };

      params =
        paymentType === PAYMENT_TYPE.CHEQUE
          ? { ...params, chequeId: values.chequeId, dueDate: values.dueDate }
          : params;

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

  const handlePayToTypeChange = (e) => {
    setPayToType(e.target.value);
    setPayToId(undefined);
    form.setFieldsValue({ payToId: undefined });
  };

  const handlePayByTypeChange = (e) => {
    setPayByType(e.target.value);
    setPayById(undefined);
    form.setFieldsValue({ payById: undefined });
  };

  const handleSelectPayTo = (value) => {
    setPayToId(value);
  };

  const handleSelectPayBy = (value) => {
    setPayById(value);
  };

  const renderCheckForm = () => {
    return (
      <>
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
      </>
    );
  };

  return (
    <div>
      <h2>Create Transaction</h2>

      <Form form={form} layout="vertical" name="nest-messages" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
        <Form.Item name="paymentType" label="Payment Type">
          <Radio.Group onChange={onChange} defaultValue={PAYMENT_TYPE.CASH} value={paymentType}>
            <Radio value={PAYMENT_TYPE.CASH}>Cash</Radio>
            <Radio value={PAYMENT_TYPE.ONLINE}>Online</Radio>
            <Radio value={PAYMENT_TYPE.CHEQUE}>Cheque</Radio>
          </Radio.Group>
        </Form.Item>
        {paymentType === "CHEQUE" ? renderCheckForm() : null}

        <Form.Item label="Pay To Type">
          <Radio.Group onChange={handlePayToTypeChange} value={payToType}>
            <Radio value="company">Company</Radio>
            <Radio value="customer">Customer</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="payToId"
          label="Paid To"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {payToType === "company" ? (
            <Select
              showSearch
              filterOption={selectSearchFilter}
              optionFilterProp="children"
              loading={companyLoading}
              placeholder="Select Company"
              allowClear
              onChange={handleSelectPayTo}
            >
              {payToCompanyData.map((obj) => (
                <Option key={obj.id} value={obj.id} disabled={obj.id === OTHER_SENTINEL && payById === OTHER_SENTINEL}>
                  {obj.companyName}
                </Option>
              ))}
            </Select>
          ) : (
            <Select
              showSearch
              filterOption={selectSearchFilter}
              optionFilterProp="children"
              loading={customerLoading}
              placeholder="Select Customer"
              allowClear
              onChange={handleSelectPayTo}
            >
              {customerData.map((obj) => (
                <Option key={obj.id} value={obj.id}>
                  {`${obj.firstName} ${obj.lastName}`}
                </Option>
              ))}
            </Select>
          )}
        </Form.Item>

        {payToId === OTHER_SENTINEL ? (
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

        <Form.Item label="Pay By Type">
          <Radio.Group onChange={handlePayByTypeChange} value={payByType}>
            <Radio value="company">Company</Radio>
            <Radio value="customer">Customer</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="payById"
          label="Paid By"
          rules={[
            {
              required: true,
            },
          ]}
        >
          {payByType === "company" ? (
            <Select
              showSearch
              filterOption={selectSearchFilter}
              optionFilterProp="children"
              loading={companyLoading}
              placeholder="Select Company"
              allowClear
              onChange={handleSelectPayBy}
            >
              {companyData.map((obj) => (
                <Option key={obj.id} value={obj.id}>
                  {obj.companyName}
                </Option>
              ))}
            </Select>
          ) : (
            <Select
              showSearch
              filterOption={selectSearchFilter}
              optionFilterProp="children"
              loading={customerLoading}
              placeholder="Select Customer"
              allowClear
              onChange={handleSelectPayBy}
            >
              {payByCustomerData.map((obj) => (
                <Option key={obj.id} value={obj.id} disabled={obj.id === OTHER_SENTINEL && payToId === OTHER_SENTINEL}>
                  {`${obj.firstName} ${obj.lastName}`}
                </Option>
              ))}
            </Select>
          )}
        </Form.Item>

        {payById === OTHER_SENTINEL ? (
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
          <DatePicker style={{ width: "100%" }} disabledDate={(current) => current && current.valueOf() > Date.now()} />
        </Form.Item>

        <Form.Item
          name="reference"
          label="Reference"
          rules={[
            {
              required: false,
              type: "string",
            },
          ]}
        >
          <Input placeholder="Enter Reference" />
        </Form.Item>

        <Form.Item className="action-btn">
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
