#pragma once

// Network task (core 0): keeps Wi-Fi up, batches uplinks to the cloud with a signed
// HTTPS POST, buffers them while offline, and hands returned downlinks to the radio task.
namespace forwarder {
void start();
bool online();  // Wi-Fi up and the last cloud call succeeded
}
