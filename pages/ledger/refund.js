import { useCallback, useEffect, useMemo, useState } from "react";

import { Alert, Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";

import AppBackButton from "@/components/backButton";
import DatePicker from "@/components/datePicker";
import SelectCustomer from "@/components/selectCustomer";
import UpdateSalesItems from "@/components/updateSaleItems";
import { useCustomerAttributes } from "@/hooks/customers";
import { createPayment } from "@/hooks/ledger";
import { getAllSalesbyCustomer } from "@/hooks/sales";
import { createSaleReturn, getReturnableSale } from "@/hooks/saleReturns";
import { PAYMENT_TYPE, SPEND_TYPE, STATUS } from "@/utils/api.util";
import permissionsUtil from "@/utils/permission.util";
import { selectSearchFilter } from "@/utils/filter.util";
import { sumItemsPrice, VALIDATE_MESSAGE } from "@/utils/ui.util";

const { Option } = Select;

const disableFutureDates = (current) => current && current.valueOf() > Date.now();

const RefundToCustomer = () => {
  const canCreate = permissionsUtil.checkAuth({
    category: "transaction",
    action: "create",
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [saleDetailsLoading, setSaleDetailsLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [returnableSale, setReturnableSale] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [updatedProducts, setUpdatedProducts] = useState([]);
  const [returnCustomerId, setReturnCustomerId] = useState(null);
  const [returnSaleId, setReturnSaleId] = useState(null);
  const [editAll, setEditAll] = useState(false);
  const [returnError, setReturnError] = useState(null);
  const [returnForm] = Form.useForm();

  const { customers, isLoading: customerLoading } = useCustomerAttributes(["firstName", "lastName", "id"]);

  const approvedSales = useMemo(() => (sales || []).filter((sale) => sale.status === STATUS.APPROVED), [sales]);
  const returnTotalAmount = useMemo(() => sumItemsPrice(selectedProducts), [selectedProducts]);

  useEffect(() => {
    returnForm.setFieldsValue({ totalAmount: returnTotalAmount });
  }, [returnForm, returnTotalAmount]);

  const onFinish = useCallback(
    async (values) => {
      setLoading(true);
      try {
        const { customerId, totalAmount, paymentDate, reference } = values;

        await createPayment({
          customerId,
          totalAmount,
          reference,
          spendType: SPEND_TYPE.DEBIT,
          paymentDate: dayjs(paymentDate),
          paymentType: PAYMENT_TYPE.CASH,
        });

        router.push("/ledger");
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    },
    [router]
  );

  const resetReturnSelection = useCallback(() => {
    setSelectedProducts([]);
    setUpdatedProducts([]);
    setReturnableSale(null);
    setReturnSaleId(null);
    setEditAll(false);
    returnForm.setFieldsValue({
      saleId: undefined,
      selectedProduct: undefined,
      totalAmount: 0,
    });
  }, [returnForm]);

  const onReturnCustomerChange = useCallback(
    async (customerId) => {
      setReturnCustomerId(customerId || null);
      setReturnError(null);
      resetReturnSelection();

      if (!customerId) {
        setSales([]);
        return;
      }

      setSalesLoading(true);
      try {
        const response = await getAllSalesbyCustomer(customerId);
        setSales(response?.rows || []);
      } catch (error) {
        console.log(error);
        setReturnError(error);
        setSales([]);
      } finally {
        setSalesLoading(false);
      }
    },
    [resetReturnSelection]
  );

  const onReturnSaleChange = useCallback(
    async (saleId) => {
      setReturnSaleId(saleId || null);
      setReturnError(null);
      setSelectedProducts([]);
      setUpdatedProducts([]);
      setEditAll(false);
      returnForm.setFieldsValue({
        selectedProduct: undefined,
        totalAmount: 0,
      });

      if (!saleId) {
        setReturnableSale(null);
        return;
      }

      setSaleDetailsLoading(true);
      try {
        const sale = await getReturnableSale(saleId);
        setReturnableSale(sale);
        setUpdatedProducts(sale?.returnableProducts || []);
      } catch (error) {
        console.log(error);
        setReturnError(error);
        setReturnableSale(null);
        setUpdatedProducts([]);
      } finally {
        setSaleDetailsLoading(false);
      }
    },
    [returnForm]
  );

  const onReturnProductsChange = useCallback(
    (productIds) => {
      const selectedItems = updatedProducts.filter((item) => productIds.includes(item.id));
      setSelectedProducts(selectedItems);
    },
    [updatedProducts]
  );

  const onRemoveReturnedProduct = useCallback(
    (id) => {
      setSelectedProducts((prev) => prev.filter((item) => item.id !== id));
      returnForm.setFieldsValue({
        selectedProduct: (returnForm.getFieldValue("selectedProduct") || []).filter((productId) => productId !== id),
      });
    },
    [returnForm]
  );

  const onSubmitReturn = useCallback(
    async (values) => {
      setReturnLoading(true);
      setReturnError(null);

      try {
        await createSaleReturn({
          saleId: values.saleId,
          customerId: returnCustomerId,
          totalAmount: returnTotalAmount,
          reference: values.reference,
          returnDate: values.returnDate ? values.returnDate.toISOString() : new Date().toISOString(),
          returnedProducts: selectedProducts.map((product) => {
            const {
              itemName,
              noOfBales,
              baleWeightLbs,
              baleWeightKgs,
              ratePerLbs,
              ratePerKgs,
              id,
              companyId,
              ratePerBale,
            } = product;

            return {
              itemName,
              noOfBales,
              id,
              companyId,
              ...(baleWeightLbs !== undefined && baleWeightLbs !== null ? { baleWeightLbs } : {}),
              ...(baleWeightKgs !== undefined && baleWeightKgs !== null ? { baleWeightKgs } : {}),
              ...(ratePerLbs !== undefined && ratePerLbs !== null ? { ratePerLbs } : {}),
              ...(ratePerKgs !== undefined && ratePerKgs !== null ? { ratePerKgs } : {}),
              ...(ratePerBale !== undefined && ratePerBale !== null ? { ratePerBale } : {}),
            };
          }),
        });

        router.push("/ledger");
      } catch (error) {
        console.log(error);
        setReturnError(error);
        setReturnLoading(false);
      }
    },
    [returnCustomerId, returnTotalAmount, selectedProducts, router]
  );

  const customerOptions = useMemo(
    () =>
      customers?.map((obj) => (
        <Option key={obj.id} value={obj.id}>
          {`${obj.firstName} ${obj.lastName}`}
        </Option>
      )),
    [customers]
  );

  const saleOptions = useMemo(
    () =>
      approvedSales.map((sale) => (
        <Option key={sale.id} value={sale.id}>
          {`Sale #${sale.id} - ${dayjs(sale.soldDate).format("DD-MM-YYYY")}`}
        </Option>
      )),
    [approvedSales]
  );

  const productOptions = useMemo(
    () =>
      updatedProducts.map((product) => (
        <Option key={product.id} value={product.id}>
          {`${product.itemName} (${product?.company?.companyName || "N/A"})`}
        </Option>
      )),
    [updatedProducts]
  );

  return (
    <div>
      <h2>Refund to Customer</h2>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Amount Refund">
            <Form layout="vertical" name="refund-to-customer" onFinish={onFinish} validateMessages={VALIDATE_MESSAGE}>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={selectSearchFilter}
                  optionFilterProp="children"
                  loading={customerLoading}
                  placeholder="Select Customer"
                  allowClear
                >
                  {customerOptions}
                </Select>
              </Form.Item>

              <Form.Item name="totalAmount" label="Amount" rules={[{ required: true, type: "string" }]}>
                <Input placeholder="Enter Amount" />
              </Form.Item>

              <Form.Item name="paymentDate" label="Payment Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} disabledDate={disableFutureDates} />
              </Form.Item>

              <Form.Item name="reference" label="Reference" rules={[{ required: false, type: "string" }]}>
                <Input placeholder="Enter Reference" />
              </Form.Item>

              <Form.Item className="action-btn">
                <AppBackButton />
                <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
                  Submit Refund
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Inventory Return">
            {returnError ? (
              <Alert style={{ marginBottom: 16 }} type="error">
                {returnError?.message || String(returnError)}
              </Alert>
            ) : null}
            <Form
              form={returnForm}
              layout="vertical"
              name="inventory-return"
              onFinish={onSubmitReturn}
              validateMessages={VALIDATE_MESSAGE}
              initialValues={{ totalAmount: 0 }}
            >
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="Customer" name="customerId" rules={[{ required: true }]}>
                    <SelectCustomer selectCustomerOnChange={onReturnCustomerChange} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Sale" name="saleId" rules={[{ required: true }]}>
                    <Select
                      showSearch
                      allowClear
                      loading={salesLoading}
                      placeholder="Select Sale"
                      optionFilterProp="children"
                      filterOption={selectSearchFilter}
                      onChange={onReturnSaleChange}
                      disabled={!returnCustomerId}
                    >
                      {saleOptions}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Return Date" name="returnDate" rules={[{ required: true }]} initialValue={dayjs()}>
                    <DatePicker style={{ width: "100%" }} disabledDate={disableFutureDates} />
                  </Form.Item>
                </Col>

                <Col span={16}>
                  <Form.Item label="Items" name="selectedProduct" rules={[{ required: true }]}>
                    <Select
                      mode="multiple"
                      showSearch
                      allowClear
                      loading={saleDetailsLoading}
                      placeholder="Select items to return"
                      optionFilterProp="children"
                      filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      onChange={onReturnProductsChange}
                      onDeselect={onRemoveReturnedProduct}
                      disabled={!returnSaleId || saleDetailsLoading || !updatedProducts.length}
                    >
                      {productOptions}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="totalAmount"
                    label="Refund Amount"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <Input readOnly />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="reference" label="Reference">
                    <Input placeholder="Enter Reference" />
                  </Form.Item>
                </Col>

                {returnSaleId && !saleDetailsLoading && returnableSale && !updatedProducts.length ? (
                  <Col span={24}>
                    <Alert type="info">All items from this sale have already been returned.</Alert>
                  </Col>
                ) : null}

                {selectedProducts.length ? (
                  <Col span={24}>
                    <Divider orientation="left">Returned Items</Divider>
                    <UpdateSalesItems
                      setSelectedProducts={setSelectedProducts}
                      data={selectedProducts}
                      editAll={editAll}
                      setEditAll={setEditAll}
                      updatedProducts={updatedProducts}
                      setUpdatedProducts={setUpdatedProducts}
                      liveUpdate={true}
                    />
                  </Col>
                ) : null}

                <Col span={24}>
                  <Form.Item className="action-btn">
                    <AppBackButton />
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={returnLoading}
                      disabled={!canCreate || !selectedProducts.length || editAll}
                    >
                      Submit Inventory Return
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RefundToCustomer;
