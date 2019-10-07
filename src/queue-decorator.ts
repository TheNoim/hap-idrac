import PQueue from 'p-queue';

const globalQueue = new PQueue({ concurrency: 1, timeout: 10000 });

function Queue(
    target: Object,
    propertyName: string,
    propertyDesciptor: PropertyDescriptor
): PropertyDescriptor {
    const method = propertyDesciptor.value;

    propertyDesciptor.value = async function(...args: any[]) {
        let localQueue: PQueue;
        // @ts-ignore
        if (this.queue) {
            // @ts-ignore
            localQueue = this.queue;
        } else {
            localQueue = globalQueue;
        }
        return await localQueue.add(() => method.bind(this)(...args));
    };

    return propertyDesciptor;
}

export { Queue };
