#### micro service image

Simple micro service built with [Koa](https://koajs.com/), for image upload and serving.

**Usage**

get
```
HTTP GET host/image_name
```

upload (using [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData))
```
HTTP PUT host/image
Content-Type: multipart/form-data
```

delete (`POST` method will be replaced by `DELETE` as soon as [koa-body](https://github.com/dlau/koa-body) will parse the request body on `DELETE` request)
```
HTTP POST host/image
Content-Type: application/json
body: { name: "image_name" }
```

**Example**

upload an image using [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
```javascript
uploadImage = async () => {
  const image = this.fileInputRef.current.files[0] // File
  const formData = new FormData()
  formData.append('image', image)
  try {
    await fetch('http://localhost:2001/image', {
      method: 'PUT',
      body: formData
    })
  } catch (e) {
    console.error(e)
  }
}
```
