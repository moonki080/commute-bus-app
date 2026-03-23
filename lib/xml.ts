import { XMLParser } from "fast-xml-parser";

import { isRecord } from "@/lib/utils";

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  textNodeName: "#text",
});

const CANDIDATE_ITEM_PATHS = [
  "response.body.items.item",
  "response.body.item",
  "response.msgBody.itemList",
  "response.msgBody.items.item",
  "ServiceResult.msgBody.itemList",
  "ServiceResult.msgBody.items.item",
  "body.items.item",
  "msgBody.itemList",
  "msgBody.items.item",
  "items.item",
  "itemList",
  "item",
];

const BODY_CONTAINER_PATHS = [
  "response.body",
  "response.msgBody",
  "ServiceResult.msgBody",
  "body",
  "msgBody",
];

const META_FIELD_NAMES = new Set([
  "numOfRows",
  "pageNo",
  "totalCount",
  "resultCode",
  "resultMsg",
  "headerCd",
  "headerMsg",
]);
const META_NODE_NAMES = new Set(["header", "msgHeader", "cmmMsgHeader"]);

export function parseXml(xml: string) {
  return parser.parse(xml);
}

export function normalizeArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function readPath(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[segment];
  }, source);
}

function extractBodyDataNode(source: unknown): unknown[] {
  if (!isRecord(source)) {
    return [];
  }

  for (const [key, value] of Object.entries(source)) {
    if (META_NODE_NAMES.has(key)) {
      continue;
    }

    if (META_FIELD_NAMES.has(key)) {
      continue;
    }

    if (["item", "itemList"].includes(key)) {
      const directItems = normalizeArray(value);
      if (directItems.length > 0) {
        return directItems;
      }
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        return value;
      }
      continue;
    }

    if (!isRecord(value)) {
      continue;
    }

    const nestedKeys = Object.keys(value).filter(
      (nestedKey) => !META_FIELD_NAMES.has(nestedKey),
    );

    if (
      nestedKeys.length > 0 &&
      nestedKeys.some((nestedKey) => !isRecord(value[nestedKey]))
    ) {
      return [value];
    }

    const nestedItems = extractBodyDataNode(value);
    if (nestedItems.length > 0) {
      return nestedItems;
    }
  }

  return [];
}

export function extractItems(source: unknown): unknown[] {
  for (const path of CANDIDATE_ITEM_PATHS) {
    const value = readPath(source, path);
    const items = normalizeArray(value);

    if (items.length > 0) {
      return items;
    }
  }

  for (const path of BODY_CONTAINER_PATHS) {
    const value = readPath(source, path);
    const items = extractBodyDataNode(value);

    if (items.length > 0) {
      return items;
    }
  }

  if (!isRecord(source)) {
    return [];
  }

  for (const [key, value] of Object.entries(source)) {
    if (["item", "itemList"].includes(key)) {
      const nested = normalizeArray(value);
      if (nested.length > 0) {
        return nested;
      }
    }

    if (isRecord(value)) {
      const bodyItems = extractBodyDataNode(value);
      if (bodyItems.length > 0) {
        return bodyItems;
      }

      const nested = extractItems(value);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

export function extractResultMeta(source: unknown) {
  const headerCandidates = [
    readPath(source, "response.header"),
    readPath(source, "response.msgHeader"),
    readPath(source, "ServiceResult.msgHeader"),
    readPath(source, "header"),
    readPath(source, "msgHeader"),
    readPath(source, "OpenAPI_ServiceResponse.cmmMsgHeader"),
  ];

  for (const header of headerCandidates) {
    if (!isRecord(header)) {
      continue;
    }

    const resultCode =
      header.resultCode ??
      header.RESULTCODE ??
      header.returnCode ??
      header.headerCd ??
      header.errCode;
    const resultMessage =
      header.resultMsg ??
      header.RESULTMSG ??
      header.returnMessage ??
      header.headerMsg ??
      header.errMsg;

    if (resultCode !== undefined || resultMessage !== undefined) {
      return {
        resultCode: resultCode ? String(resultCode) : undefined,
        resultMessage: resultMessage ? String(resultMessage) : undefined,
      };
    }
  }

  return {
    resultCode: undefined,
    resultMessage: undefined,
  };
}
