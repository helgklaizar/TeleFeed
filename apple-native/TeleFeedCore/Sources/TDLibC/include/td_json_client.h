#ifndef TD_JSON_CLIENT_H
#define TD_JSON_CLIENT_H

#ifdef __cplusplus
extern "C" {
#endif

// Returns an opaque pointer to a new instance of the TDLib client.
void *td_json_client_create(void);

// Sends request to the TDLib client. May be called from any thread.
void td_json_client_send(void *client, const char *request);

// Receives incoming updates and request responses from the TDLib client.
// May be called from any thread, but must not be called simultaneously
// from two different threads.
// Returned pointer is valid until the next call to td_json_client_receive
// or td_json_client_destroy.
const char *td_json_client_receive(void *client, double timeout);

// Synchronously executes TDLib request. May be called from any thread.
// Only a few requests can be executed synchronously.
// Returned pointer is valid until the next call to td_json_client_execute
// or td_json_client_destroy.
const char *td_json_client_execute(void *client, const char *request);

// Destroys the TDLib client instance.
// After this is called the client instance shouldn't be used anymore.
void td_json_client_destroy(void *client);

#ifdef __cplusplus
}
#endif

#endif // TD_JSON_CLIENT_H
