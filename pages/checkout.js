import Head from "next/head";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { Alert, Button, Form, Input, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

import PublicFooter from "@/components/PublicFooter";
import PublicDemoModal from "@/components/PublicDemoModal";
import PublicNav from "@/components/PublicNav";
import { post } from "@/lib/http-client";
import { BANK_PAYMENT_INSTRUCTIONS } from "@/lib/payment-instructions";
import { getPublicPaymentPackage, PUBLIC_PAYMENT_PACKAGES } from "@/lib/public-payment-packages";
import styles from "@/styles/Landing.module.css";

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

const uploadProps = {
  accept: "image/png,image/jpeg,image/webp",
  maxCount: 1,
  beforeUpload: (file) => {
    const isAllowedType = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
    if (!isAllowedType) {
      message.error("Upload a PNG, JPG, or WebP screenshot.");
      return Upload.LIST_IGNORE;
    }

    const isSmallEnough = file.size / 1024 / 1024 <= 5;
    if (!isSmallEnough) {
      message.error("Screenshot must be 5MB or smaller.");
      return Upload.LIST_IGNORE;
    }

    return false;
  },
};

export default function Checkout() {
  const router = useRouter();
  const packageSlug = Array.isArray(router.query.package) ? router.query.package[0] : router.query.package;
  const normalizedPackageSlug = PUBLIC_PAYMENT_PACKAGES[packageSlug] ? packageSlug : "monthly";
  const selectedPackage = getPublicPaymentPackage(normalizedPackageSlug);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const demoTriggerRef = useRef(null);

  const openDemo = () => {
    demoTriggerRef.current = document.activeElement;
    setModalOpen(true);
  };
  const closeDemo = () => setModalOpen(false);

  const submitPaymentProof = async (values) => {
    const file = values.proof?.[0]?.originFileObj;
    if (!file) {
      message.error("Upload a payment screenshot.");
      return;
    }

    setSubmitting(true);
    try {
      const proofImage = await getBase64(file);
      await post("/api/checkout/payment-request", {
        packageSlug: normalizedPackageSlug,
        businessName: values.businessName,
        contactName: values.contactName,
        email: values.email,
        phone: values.phone,
        referenceNumber: values.referenceNumber,
        proofImage,
        proofFileName: file.name,
        proofMimeType: file.type,
        note: values.note,
      });
      setSubmitted(true);
      form.resetFields();
    } catch (error) {
      console.error("submit public payment proof error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Proceed to online payment - TSO</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className={styles.page}>
        <PublicNav onDemoClick={openDemo} alwaysLight hrefPrefix="/" />
        <main className={styles.checkoutPage}>
          <div className={styles.checkoutInner}>
            <div className={styles.checkoutHeader}>
              <p className={styles.checkoutKicker}>TSO payment verification</p>
              <h1 className={styles.checkoutHeading}>Complete your subscription payment</h1>
              <p className={styles.checkoutSub}>
                Pay through Meezan Bank or Raast, upload your screenshot, and we will verify the payment before emailing
                your onboarding credentials.
              </p>
            </div>

            {submitted && (
              <Alert
                type="success"
                showIcon
                className={styles.checkoutAlert}
                message="Payment proof submitted"
                description="We will verify your payment and email onboarding credentials after confirmation."
              />
            )}

            <div className={styles.checkoutGrid}>
              <section className={styles.checkoutPaymentPanel} aria-labelledby="selected-package">
                <div className={styles.planHeader}>
                  <span id="selected-package" className={styles.planName}>
                    {selectedPackage.name}
                  </span>
                  <span className={styles.planBadge}>Selected</span>
                </div>
                <p className={styles.planBilling}>{selectedPackage.billing}</p>
                <div className={styles.planPrice}>
                  <span className={styles.planPriceAmt}>{selectedPackage.price}</span>
                  <span className={styles.planPricePeriod}>{selectedPackage.period}</span>
                </div>
                <p className={styles.planDesc}>Use these details for bank transfer or Raast payment.</p>
                <div className={styles.planDivider} />
                <div className={styles.paymentDetails}>
                  {BANK_PAYMENT_INSTRUCTIONS.split("\n").map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </section>

              <section className={styles.checkoutFormPanel} aria-labelledby="payment-proof-form">
                <div className={styles.checkoutPanelHead}>
                  <h2 id="payment-proof-form" className={styles.checkoutPanelTitle}>
                    Upload payment proof
                  </h2>
                  <p className={styles.checkoutPanelSub}>
                    We use this information only to match your payment and set up your account.
                  </p>
                </div>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={submitPaymentProof}
                  requiredMark={false}
                  className={styles.checkoutForm}
                >
                  <Form.Item name="businessName" label="Business name" rules={[{ required: true, min: 2 }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="contactName" label="Contact name" rules={[{ required: true, min: 2 }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email for onboarding credentials"
                    rules={[{ required: true, type: "email" }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item name="phone" label="Phone / WhatsApp">
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="referenceNumber"
                    label="Bank/Raast reference number"
                    rules={[{ required: true, min: 2 }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="proof"
                    label="Payment screenshot"
                    valuePropName="fileList"
                    getValueFromEvent={(event) => event?.fileList || []}
                    rules={[{ required: true, message: "Upload a payment screenshot" }]}
                  >
                    <Upload {...uploadProps} listType="picture">
                      <Button icon={<UploadOutlined />}>Upload screenshot</Button>
                    </Upload>
                  </Form.Item>
                  <Form.Item name="note" label="Additional note">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={submitting}>
                    Submit payment proof
                  </Button>
                </Form>
              </section>
            </div>
          </div>
        </main>
        <PublicFooter onDemoClick={openDemo} />
        <PublicDemoModal open={modalOpen} onClose={closeDemo} triggerRef={demoTriggerRef} />
      </div>
    </>
  );
}

Checkout.getLayout = (page) => page;
