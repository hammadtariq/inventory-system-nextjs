// No SSR, pure client-side
import { useRouter } from "next/router";
import { Spin, Alert } from "antd";
import { usePurchaseOrder } from "@/hooks/purchase";
import AddEditPurchase from "@/components/addEditPurchase";
import AppTitle from "@/components/title";
import { useEffect, useState } from "react";

function Update() {
  const router = useRouter();
  const { id, type } = router.query;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router.isReady]);

  const isView = type === "view";
  const { purchase, error, isLoading } = usePurchaseOrder(id);

  if (!isReady)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
        }}
      >
        <Spin size="large" />
      </div>
    );

  if (error) return <Alert message={error} type="error" />;
  if (!isLoading && purchase.status === !isView) return <Alert message={"Operation not allowed"} type="error" />;

  return (
    <div>
      <AppTitle level={2}>{isView ? `Purchase Order` : "Update Purchase Order"}</AppTitle>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <AddEditPurchase purchase={purchase} type={type} />
      )}
    </div>
  );
}

export default Update;
