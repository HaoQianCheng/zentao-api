# 交付物 (deliverable)

交付物管理，支持获取交付物列表，支持获取项目下的交付物、新增项目交付物、获取交付物详情、删除项目交付物

## 动作概览

| SDK 动作 | 说明 | 方法 | 路径 |
| --- | --- | --- | --- |
| `list` | 获取交付物列表，支持获取项目下的交付物 | `GET` | `/projects/{projectID}/deliverables` |
| `create` | 新增项目交付物 | `POST` | `/projects/{projectID}/deliverables` |
| `get` | 获取交付物详情 | `GET` | `/deliverables/{deliverableID}` |
| `delete` | 删除项目交付物 | `DELETE` | `/deliverables/{deliverableID}` |

## 获取交付物列表，支持获取项目下的交付物

- SDK 调用：`request("deliverable/list", params)`
- HTTP：`GET /projects/{projectID}/deliverables`
- 动作类型：`list`
- 最低禅道版本：`22.7` / `biz13.7` / `max8.7` / `ipd5.7`

### 路径参数

| 参数 | 说明 |
| --- | --- |
| `projectID` | 所属项目ID |

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `browseType` | string | 否 | `normal` | 交付物筛选类型，默认 normal<br>`normal` 全部<br>`pending` 待提交<br>`pendingme` 待我评审<br>`submitbyme` 我提交的<br>`reviewedbyme` 我评审过的<br>`pass` 已通过<br>`fail` 未通过<br>`bymodule` 按模块<br>`bysearch` 搜索 |
| `param` | string | 否 |  | browseType 为 bymodule 时传模块 ID，为 bysearch 时传已保存查询 ID。 |
| `orderBy` | string | 否 | `id_desc` | 排序字段，默认 id_desc。 |
| `recPerPage` | number | 否 | `20` | 每页数量，默认 20。 |
| `pageID` | number | 否 | `1` | 页码，默认 1。 |

### 请求体

无请求体。

### 返回值

- 返回形态：`list`
- 结果字段：`deliverables`
- 分页字段：`pager`

### SDK 示例

```ts
import { request } from 'zentao-api';

const result = await request("deliverable/list", {
  "projectID": 1,
  "browseType": "normal",
  "param": "<string>",
  "orderBy": "id_desc",
  "recPerPage": "20",
  "pageID": "1"
});
```
## 新增项目交付物

- SDK 调用：`request("deliverable/create", params)`
- HTTP：`POST /projects/{projectID}/deliverables`
- 动作类型：`create`
- 最低禅道版本：`22.7` / `biz13.7` / `max8.7` / `ipd5.7`

### 路径参数

| 参数 | 说明 |
| --- | --- |
| `projectID` | 项目ID |

### 查询参数

无查询参数。

### 请求体

请求体必填：是

Schema:

```json
{
  "type": "object",
  "properties": {
    "deliverable": {
      "type": "integer",
      "description": "交付物定义 ID，取自交付物列表返回的 deliverable 字段。",
      "format": "int32"
    },
    "sourceType": {
      "type": "string",
      "description": "来源类型(project 项目 | task 任务)。"
    },
    "sourceID": {
      "type": "integer",
      "description": "来源对象 ID，sourceType=project 时传项目 ID。",
      "format": "int32"
    },
    "doc": {
      "type": "object",
      "properties": [],
      "description": "交付物文档，键为交付物定义 ID；每项包含 doc(文档 ID 列表)、docVersion(版本列表)、name(名称列表)。"
    }
  },
  "required": [
    "deliverable",
    "sourceType",
    "sourceID",
    "doc"
  ]
}
```

示例:

```json
{
  "deliverable": "160",
  "sourceType": "project",
  "sourceID": 2,
  "doc": {
    "160": {
      "doc": [
        4
      ],
      "docVersion": [
        1
      ],
      "name": [
        "API 创建的交付物"
      ]
    }
  }
}
```

### 返回值

- 返回形态：`object`

### SDK 示例

```ts
import { request } from 'zentao-api';

const result = await request("deliverable/create", {
  "projectID": 1,
  "deliverable": 1,
  "sourceType": "<string>",
  "sourceID": 1,
  "doc": {}
});
```
## 获取交付物详情

- SDK 调用：`request("deliverable/get", params)`
- HTTP：`GET /deliverables/{deliverableID}`
- 动作类型：`get`
- 最低禅道版本：`22.7` / `biz13.7` / `max8.7` / `ipd5.7`

### 路径参数

| 参数 | 说明 |
| --- | --- |
| `deliverableID` | deliverableID |

### 查询参数

无查询参数。

### 请求体

无请求体。

### 返回值

- 返回形态：`object`
- 结果字段：`deliverable`

### SDK 示例

```ts
import { request } from 'zentao-api';

const result = await request("deliverable/get", {
  "deliverableID": 1
});
```
## 删除项目交付物

- SDK 调用：`request("deliverable/delete", params)`
- HTTP：`DELETE /deliverables/{deliverableID}`
- 动作类型：`delete`
- 最低禅道版本：`22.7` / `biz13.7` / `max8.7` / `ipd5.7`

### 路径参数

| 参数 | 说明 |
| --- | --- |
| `deliverableID` | deliverableID |

### 查询参数

无查询参数。

### 请求体

无请求体。

### 返回值

- 返回形态：`text`

### SDK 示例

```ts
import { request } from 'zentao-api';

const result = await request("deliverable/delete", {
  "deliverableID": 1
});
```
