### imaKoa

 :mount_fuji:   a simple micro service built with [Koa](https://koajs.com/), for image upload and serving    :mount_fuji:

**Usage**

run for development
```
npm start
```

build for production
```
npm run build
```

run for production
```
npm run serve
```

**API**

* get
```
HTTP GET host/image_name
```

* upload
```
HTTP PUT host/image
Content-Type: multipart/form-data

response:
Content-Type: application/json
body: { url: "image_url" }
```

* delete (`POST` method will be replaced by `DELETE` as soon as [koa-body](https://github.com/dlau/koa-body) will parse the request body on `DELETE` request)
```
HTTP POST host/image
Content-Type: application/json
body: { url: "image_url" }
```

**Example**

the following examples use [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

upload an image from a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) using [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
```javascript
uploadImage = async image => {     // image typeof File
  const formData = new FormData()
  formData.append('image', image)
  try {
    const response = await fetch('http://localhost:2001/image', {
      method: 'PUT',
      body: formData
    })
    const { url } = await response.json()
    // do some stuff with the image's url
  } catch (e) {
    console.error(e)
  }
}
```

delete an image from its url
```javascript
deleteImage = async url => {
  try {
    await fetch('http://localhost:2001/image', {
      method: 'POST',
      body: JSON.stringify({ url: url }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (e) {
    console.error(e)
  }
}
```