#import <Foundation/Foundation.h>
#import <IOKit/hidsystem/IOHIDEventSystemClient.h>
#include <sys/sysctl.h>

typedef struct __IOHIDEvent *IOHIDEventRef;
typedef struct __IOHIDServiceClient *IOHIDServiceClientRef;

#define IOHIDEventFieldBase(type) (type << 16)
#define kIOHIDEventTypeTemperature 15

extern IOHIDEventSystemClientRef IOHIDEventSystemClientCreate(CFAllocatorRef allocator);
extern int IOHIDEventSystemClientSetMatching(IOHIDEventSystemClientRef client, CFDictionaryRef match);
extern IOHIDEventRef IOHIDServiceClientCopyEvent(IOHIDServiceClientRef, int64_t, int32_t, int64_t);
extern CFStringRef IOHIDServiceClientCopyProperty(IOHIDServiceClientRef service, CFStringRef property);
extern double IOHIDEventGetFloatValue(IOHIDEventRef event, int32_t field);
extern CFArrayRef IOHIDEventSystemClientCopyServices(IOHIDEventSystemClientRef client);

static NSString *StringSysctl(const char *name) {
  size_t size = 0;
  if (sysctlbyname(name, NULL, &size, NULL, 0) != 0 || size == 0) {
    return @"Unknown";
  }

  char *value = malloc(size);
  if (!value) {
    return @"Unknown";
  }

  NSString *result = @"Unknown";
  if (sysctlbyname(name, value, &size, NULL, 0) == 0) {
    result = [NSString stringWithUTF8String:value] ?: @"Unknown";
  }
  free(value);
  return result;
}

static int IntSysctl(const char *name) {
  int value = 0;
  size_t size = sizeof(value);
  if (sysctlbyname(name, &value, &size, NULL, 0) != 0) {
    return 0;
  }
  return value;
}

static NSString *ThermalStateName(NSProcessInfoThermalState state) {
  switch (state) {
    case NSProcessInfoThermalStateNominal:
      return @"nominal";
    case NSProcessInfoThermalStateFair:
      return @"fair";
    case NSProcessInfoThermalStateSerious:
      return @"serious";
    case NSProcessInfoThermalStateCritical:
      return @"critical";
    default:
      return @"unknown";
  }
}

static NSNumber *RoundedTemperature(double temperature) {
  if (temperature <= 0 || temperature >= 130) {
    return nil;
  }
  return @(round(temperature * 10.0) / 10.0);
}

int main(void) {
  @autoreleasepool {
    IOHIDEventSystemClientRef client = IOHIDEventSystemClientCreate(kCFAllocatorDefault);
    NSMutableDictionary<NSString *, NSNumber *> *sensorMap = [NSMutableDictionary dictionary];

    if (client) {
      NSDictionary *match = @{ @"PrimaryUsagePage" : @(0xff00), @"PrimaryUsage" : @(5) };
      IOHIDEventSystemClientSetMatching(client, (__bridge CFDictionaryRef)match);

      NSArray *services = CFBridgingRelease(IOHIDEventSystemClientCopyServices(client));
      if (!services) {
        services = @[];
      }

      for (id service in services) {
        id product = CFBridgingRelease(IOHIDServiceClientCopyProperty((__bridge IOHIDServiceClientRef)service,
                                                                      CFSTR("Product")));
        if (![product isKindOfClass:[NSString class]]) {
          continue;
        }

        IOHIDEventRef event =
            IOHIDServiceClientCopyEvent((__bridge IOHIDServiceClientRef)service, kIOHIDEventTypeTemperature, 0, 0);
        if (!event) {
          continue;
        }

        double rawTemperature = IOHIDEventGetFloatValue(event, IOHIDEventFieldBase(kIOHIDEventTypeTemperature));
        CFRelease(event);

        NSNumber *temperature = RoundedTemperature(rawTemperature);
        if (temperature) {
          sensorMap[(NSString *)product] = temperature;
        }
      }

      CFRelease(client);
    }

    NSMutableArray *sensors = [NSMutableArray array];
    NSMutableArray<NSNumber *> *cpuTemps = [NSMutableArray array];
    NSMutableArray<NSNumber *> *gpuTemps = [NSMutableArray array];
    NSArray<NSString *> *sortedNames = [sensorMap.allKeys sortedArrayUsingSelector:@selector(localizedCaseInsensitiveCompare:)];

    for (NSString *name in sortedNames) {
      NSNumber *temperature = sensorMap[name];
      [sensors addObject:@{ @"name" : name, @"temperature" : temperature }];

      NSString *lower = name.lowercaseString;
      if ([lower containsString:@"die"]) {
        [cpuTemps addObject:temperature];
      }
      if ([lower containsString:@"gpu"]) {
        [gpuTemps addObject:temperature];
      }
    }

    double cpuAverage = -1;
    double cpuMax = -1;
    double gpuAverage = -1;

    if (cpuTemps.count > 0) {
      double sum = 0;
      double max = 0;
      for (NSNumber *temperature in cpuTemps) {
        double value = temperature.doubleValue;
        sum += value;
        if (value > max) {
          max = value;
        }
      }
      cpuAverage = round((sum / cpuTemps.count) * 10.0) / 10.0;
      cpuMax = round(max * 10.0) / 10.0;
    }

    if (gpuTemps.count > 0) {
      double sum = 0;
      for (NSNumber *temperature in gpuTemps) {
        sum += temperature.doubleValue;
      }
      gpuAverage = round((sum / gpuTemps.count) * 10.0) / 10.0;
    }

    NSString *chipModel = StringSysctl("machdep.cpu.brand_string");
    NSString *machineModel = StringSysctl("hw.model");
    int coreCount = IntSysctl("hw.ncpu");
    BOOL isAppleSilicon = [chipModel rangeOfString:@"Apple"].location != NSNotFound;
    NSString *thermalState = ThermalStateName(NSProcessInfo.processInfo.thermalState);

    NSDictionary *result = @{
      @"source" : @"embedded-helper",
      @"sensors" : sensors,
      @"cpuAverage" : @(cpuAverage),
      @"cpuMax" : @(cpuMax),
      @"gpuAverage" : @(gpuAverage),
      @"isAppleSilicon" : @(isAppleSilicon),
      @"sensorAvailable" : @(sensors.count > 0),
      @"chipModel" : chipModel,
      @"machineModel" : machineModel,
      @"coreCount" : @(coreCount),
      @"dieSensorCount" : @(cpuTemps.count),
      @"thermalState" : thermalState
    };

    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:result options:0 error:nil];
    if (jsonData) {
      printf("%s\n", ((NSString *)[[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding]).UTF8String);
    }
  }
  return 0;
}
