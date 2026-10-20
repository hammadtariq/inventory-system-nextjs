import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Ant Design helpers (antd 6; antd 5 class names kept as fallbacks). antd Selects/AutoCompletes
 * are hard to drive with plain role locators:
 * - getByRole("option", { name }) matches a hidden 0x0 accessibility listbox (aria-label = label,
 *   text = value), so clicking an option that way waits forever: click the visible virtual-list row;
 * - Form.Item labels without a `name` prop are not linked to their input, so getByLabel()
 *   finds nothing (e.g. "Company", "List Type" on the purchase form);
 * - a closing dropdown stays in the DOM for its animation, so options must be looked up in the
 *   dropdown that belongs to *this* field (antd links them: listbox id = `<input id>_list`).
 * Keep the .ant-* selectors inside this file so tests stay readable and antd upgrades are a one-file fix.
 */

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (s: string) => new RegExp(`^\\s*${escape(s)}\\s*$`);

/** The antd form field (Form.Item) whose label text is exactly `label`. */
export function antField(page: Page, label: string): Locator {
  return page
    .locator(".ant-form-item")
    .filter({ has: page.locator(".ant-form-item-label label", { hasText: exact(label) }) });
}

/** The select/autocomplete input of the field labelled `label`. */
export function antCombobox(page: Page, label: string): Locator {
  return antField(page, label).getByRole("combobox");
}

/** The dropdown that belongs to the field labelled `label` (open it first). */
async function antDropdown(page: Page, label: string): Promise<Locator> {
  const id = await antCombobox(page, label).getAttribute("id");
  if (!id) throw new Error(`antd select "${label}" has no id to link its dropdown`);
  return page.locator(".ant-select-dropdown").filter({ has: page.locator(`[id="${id}_list"]`) });
}

/** Visible option rows in the field's open dropdown (only the virtual list's rendered page). */
export async function antOptionTexts(page: Page, label: string): Promise<string[]> {
  const dropdown = await antDropdown(page, label);
  const rows = dropdown.locator(".ant-select-item-option");
  await expect(rows.first()).toBeVisible();
  return rows.allInnerTexts();
}

/** The value shown in the field's antd Select (antd 6 `.ant-select-content`, antd 5 `.ant-select-selection-item`). */
export function antSelectedValue(page: Page, label: string): Locator {
  return antField(page, label).locator(".ant-select-content, .ant-select-selection-item").first();
}

/**
 * Pick `option` (its visible text, exactly) in the antd Select of the field labelled `label`.
 * For searchable selects (showSearch / AutoComplete) it types first, which also brings options
 * outside the virtual list's first page into view.
 */
export async function antSelect(page: Page, label: string, option: string, { search = true } = {}) {
  const box = antCombobox(page, label);
  await box.click();
  if (search) await box.pressSequentially(option.slice(0, 24));
  const dropdown = await antDropdown(page, label);
  await dropdown
    .locator(".ant-select-item-option")
    .filter({ hasText: exact(option) })
    .first()
    .click();
  await expect(antSelectedValue(page, label)).toHaveText(option);
}
